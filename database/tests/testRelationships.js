// Import database connection and all models used in the relationship test
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
        // Connect to MongoDB
        await connectDB();
        console.log("Database connected");

        // Generate a unique email so the test can be run multiple times
        const testEmail = `hstyles${Date.now()}@example.com`;

        // Create test user
        const user = await User.create({
            name: "Harry Styles",
            email: testEmail,
            password_hash: "#fake321"
        });
        console.log(user);

        // Create group owned by the test user
        const group = await Group.create({
            name: "Test Group",
            owner_id: user._id
        });
        console.log(group);

        // Add the group owner as a participant
        const participant = await Participant.create({
            name: "Harry Styles",
            email: testEmail,
            group_id: group._id
        });
        console.log(participant);

        // Create a category for the group
        const category = await Category.create({
            name: "Food",
            group_id: group._id
        });
        console.log(category);

        // Create an expense linked to the group, category, and participant
        const expense = await Expense.create({
            group_id: group._id,
            category_id: category._id,
            title: "Dinner",
            paid_by: participant._id,
            total_amount: 120,
            expense_date: new Date()
        });
        console.log(expense);

        // Verify referenced documents can be retrieved using populate()
        const populatedExpense = await Expense.findById(expense._id)
            .populate("group_id")
            .populate("category_id")
            .populate("paid_by");
        console.log(populatedExpense);

        // Create the participant's share of the expense
        const expenseSplit = await ExpenseSplit.create({
            expense_id: expense._id,
            participant_id: participant._id,
            amount_owed: 120
        });
        console.log(expenseSplit);

        // Create a payment linked to the expense split
        const payment = await Payment.create({
            expense_split_id: expenseSplit._id,
            amount: 120,
            status: "sent",
            payment_method: "Zelle",
            transaction_id: "test-payment-001"
        });
        console.log(payment);
      
    // Always disconnect from MongoDB, even if the test fails
    } finally {
        await mongoose.disconnect();
    }

}

testRelationships();