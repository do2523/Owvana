const express = require("express");
const { createCatergory, deleteCategory} = require("../controllers/categoryController");
const router = express.Router();

router.post('/createCategory', createCatergory);
router.delete('/deleteCategory/:group_id/:category_id', deleteCategory);

module.exports = router;