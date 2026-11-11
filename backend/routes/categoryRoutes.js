const express = require("express");
const { createCatergory, renameCategory, deleteCategory} = require("../controllers/categoryController");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.post('/createCategory', requireAuth, createCatergory);
router.put('/renameCategory/:category_id', requireAuth, renameCategory);
router.delete('/deleteCategory/:group_id/:category_id', requireAuth, deleteCategory);

module.exports = router;