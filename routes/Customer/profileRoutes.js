const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/Customer/profileController');
const { verifyToken, isCustomer } = require('../../middlewares/auth');

// All profile routes require authentication
router.get('/get-profile', verifyToken, isCustomer, profileController.getProfile);
router.put('/update-profile', verifyToken, isCustomer, profileController.updateProfile);

module.exports = router;
