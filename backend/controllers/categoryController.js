const Category = require("../database/models/Category");
const Group = require("../database/models/Group");
const Expense = require("../database/models/Expense");
const { clientId } = require("../services/ids");

async function createCatergory(req, res)
{
    try
    {
        const{name, group_id, color, _id} = req.body;

        if(typeof name !== "string" || !name.trim() || !group_id)
            {
                return res.status(400).json({message: "Missing fields"});
            }

        const group = await Group.findOne({_id: group_id, owner_id: req.userId});

        if(!group)
            {
                return res.status(400).json({message: "Group wasn't found"});
            }

        const category = await Category.create({
            _id: clientId(_id),
            name: name.trim(),
            group_id: group._id,
            color: typeof color === "string" ? color : undefined,
        });

        res.status(201).json(category);
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"})
    }
}

async function renameCategory(req, res)
{
    try
    {
        const{category_id} = req.params;
        const{name} = req.body;

        if(typeof name !== "string" || !name.trim())
            {
                return res.status(400).json({message: "Missing fields"});
            }

        const category = await Category.findById(category_id);
        // Default categories (no group) can't be renamed
        const group = category && category.group_id && await Group.findOne({_id: category.group_id, owner_id: req.userId});

        if(!group)
            {
                return res.status(400).json({message: "Category not found"});
            }

        category.name = name.trim();
        await category.save();

        res.status(200).json({message: "Category renamed"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

async function deleteCategory(req, res)
{
    try
    {
        const{category_id, group_id} = req.params;

         if(!category_id || !group_id)
            {
                return res.status(400).json({message: "Missing fields"});
            }

        const group = await Group.findOne({_id: group_id, owner_id: req.userId});

        if(!group)
            {
                return res.status(400).json({message: "Category not found"});
            }

        const category = await Category.findOneAndDelete({_id: category_id, group_id: group._id})

        if(!category)
            {
                return res.status(400).json({message: "Category not found"});
            }

        // Expenses that used it just become uncategorized
        await Expense.updateMany({category_id: category._id}, {$unset: {category_id: 1}});

        res.status(200).json({message: "Category deleted"});
    }
    catch(err)
    {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
}

module.exports = {createCatergory, renameCategory, deleteCategory};
