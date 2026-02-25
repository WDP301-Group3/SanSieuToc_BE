const express = require('express');
const router = express.Router();
const fieldController = require('../../controllers/Customer/fieldController');

// Public routes - no authentication required
router.get('/list', fieldController.getFields);
router.get('/types', fieldController.getFieldTypes);
router.get('/:id', fieldController.getFieldById);

module.exports = router;
