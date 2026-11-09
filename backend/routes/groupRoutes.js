const express = require("express");
const { createGroup, deleteGroup, addToGroup, removeFromGroup} = require("../controllers/groupController");
const router = express.Router();

router.post("/createGroup", createGroup);
router.delete("/deleteGroup/:owner_id/:group_id", deleteGroup);
router.put("/addToGroup/:group_id", addToGroup);
router.delete("/removeFromGroup/:participant_id", removeFromGroup);

module.exports = router;
