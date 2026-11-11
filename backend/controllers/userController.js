const User = require("../database/models/User");
const Group = require("../database/models/Group");
const Category = require("../database/models/Category");
const Participant = require("../database/models/Participant");

async function deleteUser(req, res)
{
    try
    {
        const{user_id} = req.params;

        if(!user_id)
            {
                return res.status(400).json({message: "Missing fields"});
            }
        
        const user = await User.findByIdAndDelete(user_id);

        if(!user)
            {
                return res.status(400).json({message: "User not found"});
            }

        const group = await Group.find({owner_id: user._id});
        const groups_ids = group.map((g) => g._id);
        await Category.deleteMany({group_id: {$in: groups_ids}});
        await Participant.deleteMany({group_id: {$in: groups_ids}});
        await Group.deleteMany({owner_id: user._id});

        res.status(200).json({message: "User deleted"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

module.exports = {deleteUser};