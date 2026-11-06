const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", authRoutes);
app.use("/", categoryRoutes);
app.use("/", groupRoutes);
app.use("/", expenseRoutes);
app.use("/", paymentRoutes);
app.use(errorHandler);

module.exports = app;