const crypto = require("node:crypto");
const Group = require("../database/models/Group");
const User = require("../database/models/User");
const Category = require("../database/models/Category");
const Participant = require("../database/models/Participant");

async function createGroup(req, res)
{
    try
    {
        const {name, owner_id} = req.body;

        if(!name || !owner_id)
            {
                return res.status(400).json({message: "Missing fields"});
            }
        
        const user = await User.findById(owner_id);

        if(!user)
            {
                return res.status(400).json({message: "User wasn't found"});
            }
        
        const group = await Group.create({name, owner_id: user._id});
            
        res.status(201).json({
            message: "Group created successfully.",
            group: { id: group._id, name: group.name, owner_id: group.owner_id},
        });
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
        
        const group = await Group.findOneAndDelete({_id: group_id, owner_id});

        if(!group)
            {
                return res.status(400).json({message: "Group not found"});
            }
        
        const category = await Category.deleteMany({group_id: group._id});

        if(!category)
            {
                return res.status(400).json({message: "Categories not found"});
            }
        
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
        const{name, email} = req.body;

        if(!group_id || !name || !email)
        {
            return res.status(400).json({message: "Missing fields"});
        }

        const group = await Group.findById(group_id);

        if(!group)
            {
                return res.status(400).json({message: "Group wasn't found"});
            }

        const normalizedEmail = email.trim().toLowerCase();
        const token = crypto.randomBytes(32).toString('hex');
        const access_token_hash = crypto.createHash('sha256').update(token).digest('hex');

        const participant = await Participant.create({
            name: name.trim(), 
            email: normalizedEmail,
            group_id: group._id,
            access_token_hash });

        if(!participant)
            {
                return res.status(400).json({message: "Participant wasn't created"});
            }
    
        res.status(200).json({message: "Added to group",
            participant: { 
                id: participant._id, 
                name: participant.name, 
                email: participant.email, 
                group_id: group._id, 
                access_token: token,},
        })
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

        const participant = await Participant.findByIdAndDelete(participant_id);

        if(!participant)
        {
            return res.status(400).json({message: "Participant wasn't found"});
        }

        res.status(200).json({message: "Particpant removed from group"});

    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

module.exports = {createGroup, deleteGroup, addToGroup, removeFromGroup};