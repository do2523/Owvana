const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    // null = default category shared by every group
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null
    },

    color: {
        type: String,
        default: "#2b7f9e"
    }

});

module.exports = mongoose.model("Category", categorySchema);