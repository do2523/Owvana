const mongoose = require("mongoose");
const connectDB = require("../db");
const User = require("../models/User");
const Group = require("../models/Group");
const Participant = require("../models/Participant");
const Category = require("../models/Category");
const Expense = require("../models/Expense");
const ExpenseSplit = require("../models/ExpenseSplit");
const Payment = require("../models/Payment");

async function testRelationships() {

    try {
        await connectDB();
        console.log("Database connected");

        const testEmail = `hstyles${Date.now()}@example.com`;

        const user = await User.create({
            name: "Harry Styles",
            email: testEmail,
            password_hash: "#fake321"
        });
        console.log(user);

        const group = await Group.create({
            name: "Test Group",
            owner_id: user._id
        });
        console.log(group);

        const participant = await Participant.create({
            name: "Harry Styles",
            email: testEmail,
            group_id: group._id
        });
        console.log(participant);

        const category = await Category.create({
            name: "Food",
            group_id: group._id
        });
        console.log(category);

        const expense = await Expense.create({
            group_id: group._id,
            category_id: category._id,
            title: "Dinner",
            paid_by: participant._id,
            total_amount: 120,
            expense_date: new Date()
        });
        console.log(expense);

        const expenseSplit = await ExpenseSplit.create({
            expense_id: expense._id,
            participant_id: participant._id,
            amount_owed: 120
        });
        console.log(expenseSplit);

        const payment = await Payment.create({
            expense_split_id: expenseSplit._id,
            amount: 120,
            status: "sent",
            payment_method: "Zelle",
            transaction_id: "test-payment-001"
        });
        console.log(payment);

    } finally {
        await mongoose.disconnect();
    }

}

testRelationships();