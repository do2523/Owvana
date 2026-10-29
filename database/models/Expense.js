const mongoose = require("mongoose");

// Stores expenses created within a group
const expenseSchema = new mongoose.Schema({

    // References the group where the expense belongs
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    // References the category assigned to the expense
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },

    title: {
        type: String,
        required: true
    },

    // References the participant who paid for the expense
    paid_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
        required: true
    },

    total_amount: {
        type: Number,
        required: true
    },

    expense_date: {
        type: Date,
        required: true
    },

    created_at: {
        type: Date,
        default: Date.now
    }

});

// Export Expense model
module.exports = mongoose.model("Expense", expenseSchema);