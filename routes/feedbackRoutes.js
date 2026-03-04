const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken, isCustomer } = require('../middlewares/auth');

// Public routes - anyone can view feedback
router.get('/all', feedbackController.getAllFeedback);
router.get('/field/:fieldId', feedbackController.getFeedbackByField);
router.get('/stats/field/:fieldId', feedbackController.getFieldFeedbackStats);

// Protected routes - only customers can create/update/delete their own feedback
router.post('/create', verifyToken, isCustomer, feedbackController.createFeedback);
router.put('/update/:feedbackId', verifyToken, isCustomer, feedbackController.updateFeedback);
router.delete('/delete/:feedbackId', verifyToken, isCustomer, feedbackController.deleteFeedback);

module.exports = router;
