const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const dataRoutes = require("./routes/dataRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api", groupRoutes);
app.use("/api", userRoutes);
app.use("/api", dataRoutes);
app.use(errorHandler);

module.exports = app;