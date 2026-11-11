const express = require("express");
const { createGroup, updateGroup, deleteGroup, addToGroup, updateParticipant, removeFromGroup} = require("../controllers/groupController");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.post("/createGroup", requireAuth, createGroup);
router.put("/updateGroup/:group_id", requireAuth, updateGroup);
router.delete("/deleteGroup/:owner_id/:group_id", requireAuth, deleteGroup);
router.put("/addToGroup/:group_id", requireAuth, addToGroup);
router.put("/updateParticipant/:participant_id", requireAuth, updateParticipant);
router.delete("/removeFromGroup/:participant_id", requireAuth, removeFromGroup);

module.exports = router;
