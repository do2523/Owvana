const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    // payments are against a person's whole balance, so this is optional now
    expense_split_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExpenseSplit"
    },

    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        index: true
    },

    // who paid
    participant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant"
    },

    // who receives it and confirms it. empty = the group owner
    to_participant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant"
    },

    recorded_by_owner: {
        type: Boolean,
        default: false
    },

    sent_at: {
        type: Date
    },


    amount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        required: true,
        enum: ["unpaid", "sent", "confirmed", "disputed"]
    },

    payment_method: {
        type: String,
        required: true
    },

    transaction_id: {
        type: String
    },

    paid_at: {
        type: Date
    }

});

module.exports = mongoose.model("Payment", paymentSchema);