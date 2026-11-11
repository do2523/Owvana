const crypto = require("node:crypto");
const Group = require("../database/models/Group");
const User = require("../database/models/User");
const Participant = require("../database/models/Participant");
const Expense = require("../database/models/Expense");
const ExpenseSplit = require("../database/models/ExpenseSplit");
const Payment = require("../database/models/Payment");
const { deleteGroupsCascade } = require("../services/cascade");
const { clientId, newLinkToken } = require("../services/ids");

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

// What the owner sees for a participant (includes the private link token)
function participantOut(p) {
    return {
        _id: p._id,
        name: p.name,
        email: p.email,
        group_id: p.group_id,
        user_id: p.user_id,
        access_token: p.access_token,
    };
}

async function createGroup(req, res)
{
    try
    {
        const {name, scene, _id, participant_id} = req.body;

        if(typeof name !== "string" || !name.trim())
            {
                return res.status(400).json({message: "Missing fields"});
            }

        // The owner is always the logged-in user
        const user = await User.findById(req.userId);

        if(!user)
            {
                return res.status(400).json({message: "User wasn't found"});
            }

        const group = await Group.create({
            _id: clientId(_id),
            name: name.trim(),
            owner_id: user._id,
            scene: typeof scene === "string" ? scene : undefined,
        });

        // The owner also needs a participant row so they can have a share of expenses
        const token = newLinkToken();
        const ownerParticipant = await Participant.create({
            _id: clientId(participant_id),
            name: user.name,
            email: user.email,
            group_id: group._id,
            user_id: user._id,
            access_token: token,
            access_token_hash: hashToken(token),
        });

        res.status(201).json({
            message: "Group created successfully.",
            group: { id: group._id, _id: group._id, name: group.name, owner_id: group.owner_id, scene: group.scene},
            participant: participantOut(ownerParticipant),
        });
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function updateGroup(req, res)
{
    try
    {
        const{group_id} = req.params;
        const{name, scene} = req.body;

        if(typeof name !== "string" || !name.trim())
            {
                return res.status(400).json({message: "Missing fields"});
            }

        const group = await Group.findOneAndUpdate(
            {_id: group_id, owner_id: req.userId},
            {name: name.trim(), scene: typeof scene === "string" ? scene : undefined},
            {new: true}
        );

        if(!group)
            {
                return res.status(400).json({message: "Group wasn't found"});
            }

        res.status(200).json({message: "Group updated"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function deleteGroup(req, res)
{
    try
    {
        const{group_id, owner_id} = req.params;

        if(!group_id || !owner_id)
            {
                return res.status(400).json({message: "Missing fields"});
            }

        if(owner_id !== req.userId)
            {
                return res.status(403).json({message: "You can only delete your own groups"});
            }

        const group = await Group.findOne({_id: group_id, owner_id: req.userId});

        if(!group)
            {
                return res.status(400).json({message: "Group not found"});
            }

        // Removes the group plus its participants, categories, expenses, splits and payments
        await deleteGroupsCascade([group._id]);

        res.status(200).json({message: "Group deleted"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function addToGroup(req, res)
{
    try
    {
        const{group_id} = req.params;
        const{name, email, _id} = req.body;

        if(!group_id || typeof name !== "string" || !name.trim())
        {
            return res.status(400).json({message: "Missing fields"});
        }

        const group = await Group.findOne({_id: group_id, owner_id: req.userId});

        if(!group)
            {
                return res.status(400).json({message: "Group wasn't found"});
            }

        const token = newLinkToken();

        const participant = await Participant.create({
            _id: clientId(_id),
            name: name.trim(),
            email: typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined,
            group_id: group._id,
            access_token: token,
            access_token_hash: hashToken(token) });

        res.status(200).json({message: "Added to group",
            participant: participantOut(participant),
        })
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }

}

async function updateParticipant(req, res)
{
    try
    {
        const{participant_id} = req.params;
        const{name, email} = req.body;

        if(typeof name !== "string" || !name.trim())
            {
                return res.status(400).json({message: "Missing fields"});
            }

        const existing = await Participant.findById(participant_id);
        const ownedGroup = existing && await Group.findOne({_id: existing.group_id, owner_id: req.userId});

        if(!ownedGroup)
            {
                return res.status(400).json({message: "Participant wasn't found"});
            }

        existing.name = name.trim();
        existing.email = typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined;
        await existing.save();

        res.status(200).json({message: "Participant updated"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function removeFromGroup(req, res)
{
    try
    {
        const{participant_id} = req.params;

        if(!participant_id)
            {
                return res.status(400).json({message: "Missing fields"});
            }

        const existing = await Participant.findById(participant_id);
        const ownedGroup = existing && await Group.findOne({_id: existing.group_id, owner_id: req.userId});

        if(!ownedGroup)
        {
            return res.status(400).json({message: "Participant wasn't found"});
        }

        // Can't remove someone who has money attached or the totals would stop adding up
        const inUse =
            await ExpenseSplit.exists({participant_id}) ||
            await Expense.exists({paid_by: participant_id}) ||
            await Payment.exists({$or: [{participant_id}, {to_participant_id: participant_id}]});

        if(inUse)
        {
            return res.status(409).json({message: "That person has expenses or payments, so they can't be removed."});
        }

        if(existing.user_id)
        {
            return res.status(409).json({message: "The group owner can't be removed."});
        }

        await Participant.findByIdAndDelete(participant_id);

        res.status(200).json({message: "Particpant removed from group"});

    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

module.exports = {createGroup, updateGroup, deleteGroup, addToGroup, updateParticipant, removeFromGroup};
