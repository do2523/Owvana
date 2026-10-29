const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }

});

module.exports = mongoose.model("Category", categorySchema);