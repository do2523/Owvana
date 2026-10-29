const mongoose = require("mongoose");
const expenseSchema = new mongoose.Schema({

    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },

    title: {
        type: String,
        required: true
    },

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

module.exports = mongoose.model("Expense", expenseSchema);