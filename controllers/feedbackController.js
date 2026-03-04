const feedbackService = require('../services/feedbackService');

/**
 * Controller: Get all feedback with pagination
 */
const getAllFeedback = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await feedbackService.getAllFeedback(page, limit);

    res.status(200).json({
      success: true,
      message: 'Feedback retrieved successfully',
      data: result.feedbacks,
      averageRating: result.averageRating,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get All Feedback Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving feedback';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get feedback by field with pagination
 */
const getFeedbackByField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { page, limit } = req.query;

    const result = await feedbackService.getFeedbackByField(fieldId, page, limit);

    res.status(200).json({
      success: true,
      message: 'Field feedback retrieved successfully',
      data: result.feedbacks,
      averageRating: result.averageRating,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get Feedback By Field Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving field feedback';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Create feedback
 */
const createFeedback = async (req, res) => {
  try {
    const { bookingDetailID, rate, content } = req.body;

    const result = await feedbackService.createFeedback(req.userId, {
      bookingDetailID,
      rate,
      content
    });

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: result.feedback
    });
  } catch (error) {
    console.error('Create Feedback Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while creating feedback';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Update feedback
 */
const updateFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { rate, content } = req.body;

    const result = await feedbackService.updateFeedback(req.userId, feedbackId, {
      rate,
      content
    });

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: result.feedback
    });
  } catch (error) {
    console.error('Update Feedback Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while updating feedback';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Delete feedback
 */
const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    await feedbackService.deleteFeedback(req.userId, feedbackId);

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete Feedback Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while deleting feedback';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get field feedback statistics
 */
const getFieldFeedbackStats = async (req, res) => {
  try {
    const { fieldId } = req.params;

    const stats = await feedbackService.getFieldFeedbackStats(fieldId);

    res.status(200).json({
      success: true,
      message: 'Feedback statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get Feedback Stats Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving feedback statistics';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

module.exports = {
  getAllFeedback,
  getFeedbackByField,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFieldFeedbackStats
};
