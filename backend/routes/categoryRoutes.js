const express = require("express");
const { createCatergory, deleteCategory} = require("../controllers/categoryController");
const router = express.Router();

router.post('/createCategory', createCatergory);
router.delete('/deleteCategory', deleteCategory);

module.exports = router;