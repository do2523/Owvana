const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const Group = require("../database/models/Group");
const User = require("../database/models/User");

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
        const{id, owner_id} = req.params;

        if(!id || !owner_id)
            {
                 return res.status(400).json({message: "Missing fields"});
            }
        
        const group = await Group.findOneAndDelete({_id: id, owner_id});

        if(!group)
            {
                res.status(404).json({message: "Group not found"});
            }
        
         res.status(200).json({message: "Group deleted"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

module.exports = {createGroup, deleteGroup};