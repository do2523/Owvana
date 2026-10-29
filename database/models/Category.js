const mongoose = require("mongoose");

// Stores expense categories for individual groups
const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    // Optional reference to the group that owns this category
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }

});

// Export Category model
module.exports = mongoose.model("Category", categorySchema);