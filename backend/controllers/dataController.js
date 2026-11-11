const User = require("../database/models/User");
const Group = require("../database/models/Group");
const Category = require("../database/models/Category");
const Participant = require("../database/models/Participant");
const Expense = require("../database/models/Expense");
const ExpenseSplit = require("../database/models/ExpenseSplit");
const Payment = require("../database/models/Payment");
const crypto = require("node:crypto");
const { clientId, isId } = require("../services/ids");
const { sendVerificationEmail } = require("../services/mailer");

// ---------- shapes sent to the frontend ----------

function userOut(u) {
    return { _id: u._id, name: u.name, email: u.email, email_verified: u.email_verified, created_at: u.created_at };
}

function participantOut(p, { token = true, email = true } = {}) {
    return {
        _id: p._id,
        name: p.name,
        email: email ? p.email : undefined,
        group_id: p.group_id,
        user_id: p.user_id,
        access_token: token ? p.access_token : undefined,
    };
}

// the frontend keeps dates as YYYY-MM-DD
function expenseOut(e) {
    return {
        _id: e._id,
        group_id: e.group_id,
        category_id: e.category_id,
        title: e.title,
        paid_by: e.paid_by,
        total_amount: e.total_amount,
        expense_date: new Date(e.expense_date).toISOString().slice(0, 10),
        created_at: e.created_at,
        split_type: e.split_type,
    };
}

function splitOut(s) {
    return { _id: s._id, expense_id: s.expense_id, participant_id: s.participant_id, amount_owed: s.amount_owed, split_value: s.split_value };
}

function paymentOut(p) {
    return {
        _id: p._id,
        participant_id: p.participant_id,
        to_participant_id: p.to_participant_id,
        group_id: p.group_id,
        amount: p.amount,
        status: p.status,
        payment_method: p.payment_method,
        transaction_id: p.transaction_id,
        sent_at: p.sent_at,
        paid_at: p.paid_at,
        recorded_by_owner: p.recorded_by_owner,
    };
}

function categoryOut(c) {
    return { _id: c._id, name: c.name, group_id: c.group_id ?? null, color: c.color };
}

// Everything in some groups, shaped for the frontend
async function loadGroupData(groupIds, shape) {
    const [participants, categories, expenses, payments] = await Promise.all([
        Participant.find({ group_id: { $in: groupIds } }).lean(),
        Category.find({ $or: [{ group_id: null }, { group_id: { $in: groupIds } }] }).lean(),
        Expense.find({ group_id: { $in: groupIds } }).lean(),
        Payment.find({ group_id: { $in: groupIds } }).lean(),
    ]);
    const splits = await ExpenseSplit.find({ expense_id: { $in: expenses.map((e) => e._id) } }).lean();

    return {
        participants: participants.map(shape),
        categories: categories.map(categoryOut),
        expenses: expenses.map(expenseOut),
        expense_splits: splits.map(splitOut),
        payments: payments.map(paymentOut),
    };
}

function cents(value) {
    return Math.round(Number(value) * 100);
}

// ---------- owner: load everything ----------

async function getData(req, res) {
    try {
        const user = await User.findById(req.userId).lean();

        if (!user) {
            return res.status(401).json({ message: "Account not found. Please log in again." });
        }

        const groups = await Group.find({ owner_id: user._id }).lean();
        const rest = await loadGroupData(groups.map((g) => g._id), (p) => participantOut(p));

        res.status(200).json({
            user: userOut(user),
            groups: groups.map((g) => ({ _id: g._id, name: g.name, owner_id: g.owner_id, created_at: g.created_at, scene: g.scene })),
            ...rest,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

// ---------- profile ----------

async function updateProfile(req, res) {
    try {
        const { name, email } = req.body;

        if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
            return res.status(400).json({ message: "A name and a valid email are required." });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(401).json({ message: "Account not found. Please log in again." });
        }

        const address = email.trim().toLowerCase();
        const emailChanged = address !== user.email;

        if (emailChanged && (await User.exists({ email: address }))) {
            return res.status(409).json({ message: "An account with that email already exists." });
        }

        user.name = name.trim();
        user.email = address;

        let token;
        if (emailChanged) {
            // a new address has to be verified again
            token = crypto.randomBytes(32).toString("hex");
            user.email_verified = false;
            user.verify_token_hash = crypto.createHash("sha256").update(token).digest("hex");
            user.verify_expires_at = Date.now() + 24 * 60 * 60 * 1000;
        }

        await user.save();
        await Participant.updateMany({ user_id: user._id }, { name: user.name, email: user.email });

        if (token) {
            try {
                await sendVerificationEmail(user.email, token);
            } catch (mailError) {
                console.error("Failed to send verification email:", mailError);
            }
        }

        res.status(200).json({ message: "Profile updated", user: userOut(user) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

// ---------- expenses ----------

const SPLIT_TYPES = ["equal", "exact", "percent", "shares"];

async function saveExpense(req, res) {
    try {
        const { _id, group_id, title, total_amount, expense_date, paid_by, category_id, split_type, splits } = req.body;

        if (
            !isId(group_id) ||
            typeof title !== "string" ||
            !title.trim() ||
            !(Number(total_amount) > 0) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(String(expense_date)) ||
            !isId(paid_by) ||
            !SPLIT_TYPES.includes(split_type) ||
            !Array.isArray(splits) ||
            splits.length === 0
        ) {
            return res.status(400).json({ message: "Missing or invalid fields" });
        }

        const group = await Group.findOne({ _id: group_id, owner_id: req.userId });

        if (!group) {
            return res.status(400).json({ message: "Group wasn't found" });
        }

        // everyone involved has to be in this group
        const people = await Participant.find({ group_id: group._id }, "_id").lean();
        const inGroup = new Set(people.map((p) => String(p._id)));

        if (!inGroup.has(paid_by) || splits.some((s) => !inGroup.has(String(s.participant_id)))) {
            return res.status(400).json({ message: "Everyone on an expense must be in the group" });
        }

        const owed = splits.reduce((sum, s) => sum + cents(s.amount_owed), 0);

        if (splits.some((s) => !(Number(s.amount_owed) >= 0)) || owed !== cents(total_amount)) {
            return res.status(400).json({ message: "The split has to add up to the total" });
        }

        // category must be a default one or belong to this group
        let category;
        if (isId(category_id)) {
            category = await Category.findOne({ _id: category_id, $or: [{ group_id: null }, { group_id: group._id }] });
        }

        const fields = {
            group_id: group._id,
            title: title.trim(),
            total_amount: Number(total_amount),
            expense_date: new Date(`${expense_date}T00:00:00.000Z`),
            paid_by,
            category_id: category ? category._id : undefined,
            split_type,
        };

        let expense = isId(_id) ? await Expense.findOne({ _id, group_id: group._id }) : null;

        if (expense) {
            expense.set(fields);
            if (!category) expense.category_id = undefined;
            await expense.save();
        } else {
            expense = await Expense.create({ _id: clientId(_id), ...fields });
        }

        // splits are replaced as a whole
        await ExpenseSplit.deleteMany({ expense_id: expense._id });
        const saved = await ExpenseSplit.insertMany(
            splits.map((s) => ({
                _id: clientId(s._id),
                expense_id: expense._id,
                participant_id: s.participant_id,
                amount_owed: Number(s.amount_owed),
                split_value: Number(s.split_value) || 0,
            }))
        );

        res.status(200).json({ expense: expenseOut(expense), expense_splits: saved.map(splitOut) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

async function deleteExpense(req, res) {
    try {
        const { expense_id } = req.params;
        const expense = await Expense.findById(expense_id);
        const group = expense && (await Group.findOne({ _id: expense.group_id, owner_id: req.userId }));

        if (!group) {
            return res.status(400).json({ message: "Expense not found" });
        }

        await ExpenseSplit.deleteMany({ expense_id: expense._id });
        await expense.deleteOne();

        res.status(200).json({ message: "Expense deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

// ---------- payments ----------

function validPayment(body) {
    return Number(body.amount) > 0 && typeof body.payment_method === "string" && body.payment_method.trim();
}

// owner got cash in person, counts as confirmed right away
async function recordPayment(req, res) {
    try {
        const { _id, participant_id, amount, payment_method, transaction_id } = req.body;

        if (!isId(participant_id) || !validPayment(req.body)) {
            return res.status(400).json({ message: "Missing or invalid fields" });
        }

        const participant = await Participant.findById(participant_id);
        const group = participant && (await Group.findOne({ _id: participant.group_id, owner_id: req.userId }));

        if (!group) {
            return res.status(400).json({ message: "Participant wasn't found" });
        }

        const now = new Date();
        const payment = await Payment.create({
            _id: clientId(_id),
            participant_id: participant._id,
            group_id: group._id,
            amount: Number(amount),
            status: "confirmed",
            payment_method: payment_method.trim(),
            transaction_id: transaction_id || undefined,
            sent_at: now,
            paid_at: now,
            recorded_by_owner: true,
        });

        res.status(201).json({ payment: paymentOut(payment) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

// Whoever receives the money confirms (or disputes) it. Owner passes req.userId, a link passes the participant.
async function setPaymentStatus(res, payment, receiverId, status) {
    if (!["confirmed", "disputed"].includes(status)) {
        return res.status(400).json({ message: "Status must be confirmed or disputed" });
    }

    if (!payment || String(payment.to_participant_id ?? "") !== String(receiverId)) {
        return res.status(400).json({ message: "Payment not found" });
    }

    if (payment.status !== "sent") {
        return res.status(409).json({ message: "That payment was already answered" });
    }

    payment.status = status;
    if (status === "confirmed") payment.paid_at = new Date();
    await payment.save();

    return res.status(200).json({ payment: paymentOut(payment) });
}

async function ownerParticipantId(groupId, ownerId) {
    const p = await Participant.findOne({ group_id: groupId, user_id: ownerId }, "_id").lean();
    return p ? p._id : null;
}

async function confirmPayment(req, res) {
    try {
        const payment = isId(req.params.payment_id) ? await Payment.findById(req.params.payment_id) : null;
        const group = payment && (await Group.findOne({ _id: payment.group_id, owner_id: req.userId }));

        if (!group) {
            return res.status(400).json({ message: "Payment not found" });
        }

        // no recipient saved = the owner is the one who gets it
        const ownerId = await ownerParticipantId(group._id, req.userId);
        if (!payment.to_participant_id) payment.to_participant_id = ownerId;

        return await setPaymentStatus(res, payment, ownerId, req.body.status);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

// ---------- participant links (no login) ----------

async function participantFromToken(token) {
    return typeof token === "string" && token.length >= 16 ? Participant.findOne({ access_token: token }) : null;
}

async function getLink(req, res) {
    try {
        const me = await participantFromToken(req.params.token);
        const group = me && (await Group.findById(me.group_id).lean());

        if (!group) {
            return res.status(404).json({ message: "Link not found" });
        }

        // other people's private links and emails stay private
        const rest = await loadGroupData([group._id], (p) =>
            String(p._id) === String(me._id) ? participantOut(p) : participantOut(p, { token: false, email: false })
        );

        res.status(200).json({
            group: { _id: group._id, name: group.name, owner_id: group.owner_id, created_at: group.created_at, scene: group.scene },
            ...rest,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

async function linkSendPayment(req, res) {
    try {
        const me = await participantFromToken(req.params.token);
        const { _id, to_participant_id, amount, payment_method, transaction_id } = req.body;

        if (!me || !isId(to_participant_id) || !validPayment(req.body)) {
            return res.status(400).json({ message: "Missing or invalid fields" });
        }

        const to = await Participant.findOne({ _id: to_participant_id, group_id: me.group_id });

        if (!to || String(to._id) === String(me._id)) {
            return res.status(400).json({ message: "Pick someone else in your group to pay" });
        }

        const payment = await Payment.create({
            _id: clientId(_id),
            participant_id: me._id,
            to_participant_id: to._id,
            group_id: me.group_id,
            amount: Number(amount),
            status: "sent",
            payment_method: payment_method.trim(),
            transaction_id: transaction_id || undefined,
            sent_at: new Date(),
        });

        res.status(201).json({ payment: paymentOut(payment) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

async function linkConfirmPayment(req, res) {
    try {
        const me = await participantFromToken(req.params.token);
        const payment = me && isId(req.params.payment_id) ? await Payment.findOne({ _id: req.params.payment_id, group_id: me.group_id }) : null;

        if (!me || !payment) {
            return res.status(400).json({ message: "Payment not found" });
        }

        // a payment with no recipient goes to the group owner
        if (!payment.to_participant_id) {
            const group = await Group.findById(me.group_id).lean();
            payment.to_participant_id = await ownerParticipantId(me.group_id, group.owner_id);
        }

        return await setPaymentStatus(res, payment, me._id, req.body.status);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    getData,
    updateProfile,
    saveExpense,
    deleteExpense,
    recordPayment,
    confirmPayment,
    getLink,
    linkSendPayment,
    linkConfirmPayment,
};
