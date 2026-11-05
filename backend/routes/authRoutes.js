const express = require("express");
const { register } = require("../controllers/authController");
const { login } = require("../../API/authorization/login");
const { verifyEmail } = require("../../API/authorization/verifyEmail");
const { resetPassword } = require("../../API/authorization/passwordController");
const { forgotPassword } = require("../../API/authorization/passwordController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verifyEmail", verifyEmail);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);

module.exports = router;