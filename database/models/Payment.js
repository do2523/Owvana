const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

    expense_split_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExpenseSplit",
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        required: true
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