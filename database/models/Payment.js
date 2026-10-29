const mongoose = require("mongoose");

// Stores payments made toward an expense split
const paymentSchema = new mongoose.Schema({

    // References the expense split being paid
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
        required: true,
        // Restrict payment status to values used by the frontend payment flow
        enum: ["unpaid", "sent", "confirmed", "disputed"]
    },

    payment_method: {
        type: String,
        required: true
    },

    transaction_id: {
        type: String
    },

    // Stores the time the payment is confirmed
    paid_at: {
        type: Date
    }

});

// Export Payment model
module.exports = mongoose.model("Payment", paymentSchema);