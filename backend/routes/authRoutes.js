const express = require("express");
const { register, verifyEmail, forgotPassword, resetPassword } = require("../controllers/authController");
const { login } = require("../../API/authorization/login");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verifyEmail", verifyEmail);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);

module.exports = router;