const express = require('express');
const router = express.Router();
const authController = require('../../controllers/Customer/authController');
const { verifyToken, isCustomer } = require('../../middlewares/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.put('/change-password', verifyToken, isCustomer, authController.changePassword);

module.exports = router;
