const express = require("express");
const { deleteUser } = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.delete("/deleteUser/:user_id", requireAuth, deleteUser);

module.exports = router;