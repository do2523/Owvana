require("dotenv").config();

const port = Number(process.env.PORT || 5000);
const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/expense_tracker";

// Where emailed links point (the React app)
const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

// Resend settings
const resendApiKey = process.env.RESEND_API_KEY || "";

const emailFrom = process.env.EMAIL_FROM || "";

const jwtSecret = process.env.JWT_SECRET || "";

module.exports = { mongoUri, port, appUrl, resendApiKey, emailFrom, jwtSecret };
