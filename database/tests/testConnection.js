// Import database connection and Mongoose
const connectDB = require("../db");
const mongoose = require("mongoose");

// Verify that Mongoose can successfully connect to MongoDB
async function testConnection() {
    
    await connectDB();
    console.log("Database connected");
    
    // Close the database connection after the test
    await mongoose.disconnect();

}

testConnection();