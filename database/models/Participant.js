const mongoose = require("mongoose");

// Stores people participating in an expense group
const participantSchema = new mongoose.Schema({
    
    name: {
        type: String,
        required: true
    },

    email: {
        type: String
    },

    // References the group this participant belongs to
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    // Stores hashed token used for participant access links
    access_token_hash: {
        type: String
    }

});

// Export Participant model
module.exports = mongoose.model("Participant", participantSchema);