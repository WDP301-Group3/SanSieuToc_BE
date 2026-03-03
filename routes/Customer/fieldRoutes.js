const express = require('express');
const router = express.Router();
const fieldController = require('../../controllers/Customer/fieldController');

// Public routes - no authentication required
router.get('/list', fieldController.getFields);
router.get('/categories', fieldController.getCategories);
router.get('/types', fieldController.getFieldTypes);
router.get('/types/category/:categoryId', fieldController.getFieldTypesByCategory);
router.get('/:id', fieldController.getFieldById);

module.exports = router;
