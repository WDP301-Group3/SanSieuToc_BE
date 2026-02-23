const express = require('express');
const router = express.Router();
const authController = require('../../controllers/Manager/authController');

// Public routes
router.post('/login', authController.login);

module.exports = router;
