const express = require("express");
const { createGroup, deleteGroup } = require("../controllers/groupController");
const router = express.Router();

router.post("/createGroup", createGroup);
router.delete("/deleteGroup/:owner_id/:id", deleteGroup);

module.exports = router;