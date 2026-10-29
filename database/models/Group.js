const mongoose = require("mongoose");

// Stores expense groups created by registered users
const groupSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    // Reference to the user who owns the group
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    created_at: {
        type: Date,
        default: Date.now
    }
    
});

// Export Gorup model
module.exports = mongoose.model("Group", groupSchema);