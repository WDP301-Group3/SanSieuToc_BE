const express = require('express');
const router = express.Router();
const fieldController = require('../../controllers/Customer/fieldController');

// Public routes - no authentication required
// IMPORTANT: Specific routes must come BEFORE parameterized routes
router.get('/list', fieldController.getFields);
router.get('/categories', fieldController.getCategories);
router.get('/types', fieldController.getFieldTypes);
router.get('/types/category/:categoryId', fieldController.getFieldTypesByCategory);

/**
 * @route   GET /api/customer/fields/:fieldId
 * @desc    Get field detail by ID
 * @access  Public
 */
router.get('/:fieldId', fieldController.getFieldDetail);


module.exports = router;
