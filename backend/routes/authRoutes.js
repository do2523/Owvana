const express = require("express");
const { register } = require("../controllers/authController");
const { login } = require("../../API/authorization/login");
const { verifyEmail } = require("../controllers/authController");
const { resetPassword } = require("../controllers/authController");
const { forgotPassword } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verifyEmail", verifyEmail);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);

module.exports = router;