const mongoose = require("mongoose");
const participantSchema = new mongoose.Schema({
    
    name: {
        type: String,
        required: true
    },

    email: {
        type: String
    },

    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    // the account this participant belongs to (set for the group owner)
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    // private link token. the owner needs to see the link again, so it is stored as is
    access_token: {
        type: String,
        index: true
    },

    access_token_hash: {
        type: String
    }

});

module.exports = mongoose.model("Participant", participantSchema);