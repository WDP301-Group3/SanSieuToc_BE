const express = require('express');
const router = express.Router();
const authController = require('../../controllers/Manager/authController');
const { verifyToken, isManager } = require('../../middlewares/auth');

// Public routes
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.put('/change-password', verifyToken, isManager, authController.changePassword);

module.exports = router;
