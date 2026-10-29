const mongoose = require("mongoose");

// Connect the application to the MongoDB expense_tracker database
async function connectDB() {
    
    await mongoose.connect("mongodb://127.0.0.1:27017/expense_tracker")

}

// Export connection function for use throughout the project
module.exports = connectDB;