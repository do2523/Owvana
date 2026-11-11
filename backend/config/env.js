require("dotenv").config();

const port = Number(process.env.PORT || 5000);
const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/expense_tracker";

// Where emailed links point (the React app)
const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

// SMTP settings. Defaults are for Gmail (use an App Password, not your login password)
const smtp = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || process.env.SMTP_USER || "",
};

const jwtSecret = process.env.JWT_SECRET || "";

module.exports = { mongoUri, port, appUrl, smtp, jwtSecret };
