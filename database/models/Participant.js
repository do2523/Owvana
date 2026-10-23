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

    access_token_hash: {
        type: String
    }

});

module.exports = mongoose.model("Participant", participantSchema);