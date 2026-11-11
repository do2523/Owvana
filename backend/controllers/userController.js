const User = require("../database/models/User");
const Group = require("../database/models/Group");
const { deleteGroupsCascade } = require("../services/cascade");

async function deleteUser(req, res)
{
    try
    {
        const{user_id} = req.params;

        if(!user_id)
            {
                return res.status(400).json({message: "Missing fields"});
            }

        if(user_id !== req.userId)
            {
                return res.status(403).json({message: "You can only delete your own account"});
            }

        const user = await User.findByIdAndDelete(req.userId);

        if(!user)
            {
                return res.status(400).json({message: "User not found"});
            }

        const groups = await Group.find({owner_id: user._id}, "_id").lean();
        await deleteGroupsCascade(groups.map((g) => g._id));

        res.status(200).json({message: "User deleted"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

module.exports = {deleteUser};
