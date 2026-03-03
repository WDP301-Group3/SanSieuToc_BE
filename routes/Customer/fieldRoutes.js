const express = require('express');
const router = express.Router();
const fieldController = require('../../controllers/Customer/fieldController');

/**
 * @route   GET /api/customer/fields/:fieldId
 * @desc    Get field detail by ID
 * @access  Public
 */
router.get('/:fieldId', fieldController.getFieldDetail);

module.exports = router;
