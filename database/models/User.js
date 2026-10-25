const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    email_verified: {
        type: Boolean,
        default: false
    },

    password_hash: {
        type: String,
        required: true
    },

    verify_token_hash: {
        type: String
    },

    verify_expires_at: {
        type: Date
    },

    reset_token_hash: {
        type: String
    },

    reset_expires_at: {
        type: Date
    },

    created_at: {
        type: Date,
        default: Date.now
    }
    
});

module.exports = mongoose.model("User", userSchema);