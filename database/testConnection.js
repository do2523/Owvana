const connectDB = require("./db");
const mongoose = require("mongoose");

async function testConnection() {
    
    await connectDB();
    console.log("Database connected");
    await mongoose.disconnect();

}

testConnection();