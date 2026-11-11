const Category = require("../database/models/Category");

const DEFAULTS = [
    { name: "Lodging", color: "#2b7f9e" },
    { name: "Food", color: "#e4703a" },
    { name: "Transport", color: "#8a5a8c" },
];

// Categories every group gets (group_id null). Safe to run on every start.
async function ensureDefaultCategories() {
    for (const { name, color } of DEFAULTS) {
        await Category.updateOne(
            { name, group_id: null },
            { $setOnInsert: { name, color, group_id: null } },
            { upsert: true }
        );
    }
}

module.exports = { ensureDefaultCategories };
