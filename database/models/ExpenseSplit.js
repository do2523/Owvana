const mongoose = require("mongoose");

// Stores each participant's portion of an expense
const expenseSplitSchema = new mongoose.Schema({

    // References the expense being split
    expense_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
        required: true
    },

    // References the participant who owes this amount
    participant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
        required: true
    },

    amount_owed: {
        type: Number,
        required: true
    }

}, {
    // Keep collection name consistent with the project ERD
    collection: "expense_splits"
});

// Export ExpenseSplit model
module.exports = mongoose.model("ExpenseSplit", expenseSplitSchema);