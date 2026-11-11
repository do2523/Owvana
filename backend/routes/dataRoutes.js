const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
    getData,
    updateProfile,
    saveExpense,
    deleteExpense,
    recordPayment,
    confirmPayment,
    getLink,
    linkSendPayment,
    linkConfirmPayment,
} = require("../controllers/dataController");
const router = express.Router();

// logged in owner
router.get("/data", requireAuth, getData);
router.put("/updateProfile", requireAuth, updateProfile);
router.post("/saveExpense", requireAuth, saveExpense);
router.delete("/deleteExpense/:expense_id", requireAuth, deleteExpense);
router.post("/recordPayment", requireAuth, recordPayment);
router.post("/confirmPayment/:payment_id", requireAuth, confirmPayment);

// participant links: the private token in the URL is the login
router.get("/link/:token", getLink);
router.post("/link/:token/sendPayment", linkSendPayment);
router.post("/link/:token/confirmPayment/:payment_id", linkConfirmPayment);

module.exports = router;
