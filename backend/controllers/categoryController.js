const Category = require("../database/models/Category");
const Group = require("../database/models/Group");

async function createCatergory(req, res)
{
    try
    {
        const{name, group_id} = req.body;

        if(!name || !group_id)
            {
                res.status(400).json({message: "Missing fields"});
            }

        const group = await Group.findById(group_id);

        if(!group)
            {
                return res.status(400).json({message: "Group wasn't found"});
            }
            
        const category = await Category.create({name, group_id: group.owner_id});

        if(!category)
            {
                res.status(400).json({message: "Failed to create category"});
            }
        
        res.status(201).json(category);
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"})
    }
}

async function deleteCategory(req, res)
{
    try
    {
        const{id, group_id} = req.params;

         if(!id || !group_id)
            {
                 return res.status(400).json({message: "Missing fields"});
            }

        const category = await Category.findOneAndDelete({_id: id, group_id})

        if(!category)
            {
                res.status(400).json({message: "Category not found"});
            }
        
        
        res.status(201).json({message: "Category deleted"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

module.exports = {createCatergory, deleteCategory};