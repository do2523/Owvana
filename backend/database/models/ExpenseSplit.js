const mongoose = require("mongoose");

const expenseSplitSchema = new mongoose.Schema({
    
    expense_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
        required: true
    },

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
    collection: "expense_splits"
});

module.exports = mongoose.model("ExpenseSplit", expenseSplitSchema);