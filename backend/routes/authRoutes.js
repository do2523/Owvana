const express = require("express");
const { register, verifyEmail, resendVerification, forgotPassword, resetPassword } = require("../controllers/authController");
const { login } = require("../../API/authorization/login");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verifyEmail", verifyEmail);
router.post("/resendVerification", resendVerification);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);

module.exports = router;