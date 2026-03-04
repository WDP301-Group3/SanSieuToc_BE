const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/Manager/customerController');
const { verifyToken, isManager } = require('../../middlewares/auth');

// Get customers list (with filters and pagination)
router.get('/', verifyToken, isManager, customerController.getCustomers);

// Get customer statistics
router.get('/stats', verifyToken, isManager, customerController.getCustomerStats);

// Get customer by ID
router.get('/:customerId', verifyToken, isManager, customerController.getCustomerById);

// Update customer status (ban/unban)
router.put('/:customerId/status', verifyToken, isManager, customerController.updateCustomerStatus);

module.exports = router;

