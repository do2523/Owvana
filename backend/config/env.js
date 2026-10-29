const port = Number(process.env.PORT || 5000);
const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/expense_tracker";

module.exports = { mongoUri, port };