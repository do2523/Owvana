const express = require("express");
const { deleteUser } = require("../controllers/userController");
const router = express.Router();

router.delete("/deleteUser/:user_id", deleteUser);

module.exports = router;