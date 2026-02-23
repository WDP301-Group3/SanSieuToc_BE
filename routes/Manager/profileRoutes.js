const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/Manager/profileController');
const { verifyToken, isManager } = require('../../middlewares/auth');

// All profile routes require authentication
router.get('/get-profile', verifyToken, isManager, profileController.getProfile);
router.put('/update-profile', verifyToken, isManager, profileController.updateProfile);

module.exports = router;
