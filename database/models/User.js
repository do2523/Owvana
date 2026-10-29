const mongoose = require("mongoose");

// Stores registered user account information
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

    // Indicates whether the user's email has been verified
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

    // Token and expiration for password reset functionality
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

// Export User model for use by the API
module.exports = mongoose.model("User", userSchema);