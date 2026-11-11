const Group = require("../database/models/Group");
const Category = require("../database/models/Category");
const Participant = require("../database/models/Participant");
const Expense = require("../database/models/Expense");
const ExpenseSplit = require("../database/models/ExpenseSplit");
const Payment = require("../database/models/Payment");

// Deletes groups and everything inside them
async function deleteGroupsCascade(groupIds) {
    if (!groupIds.length) return;

    const expenses = await Expense.find({ group_id: { $in: groupIds } }, "_id").lean();

    await ExpenseSplit.deleteMany({ expense_id: { $in: expenses.map((e) => e._id) } });
    await Expense.deleteMany({ group_id: { $in: groupIds } });
    await Payment.deleteMany({ group_id: { $in: groupIds } });
    await Participant.deleteMany({ group_id: { $in: groupIds } });
    await Category.deleteMany({ group_id: { $in: groupIds } });
    await Group.deleteMany({ _id: { $in: groupIds } });
}

module.exports = { deleteGroupsCascade };
