const Feedback = require("../models/Feedback");
const BookingDetail = require("../models/BookingDetail");
const Booking = require("../models/Booking");
const Field = require("../models/Field");
const { isValidText, isValidRating } = require("../utils/validators");

/**
 * Service: Get all feedback with pagination
 */
const getAllFeedback = async (page = 1, limit = 10) => {
  try {
    // Validate pagination
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, Math.min(50, parseInt(limit) || 10)); // Max 50 per page

    const skip = (page - 1) * limit;

    // Get total count
    const total = await Feedback.countDocuments();

    // Calculate average rating
    const ratingStats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rate" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const averageRating =
      ratingStats.length > 0
        ? parseFloat(ratingStats[0].averageRating.toFixed(1))
        : 0;

    // Get paginated feedback with populated data
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "bookingDetailID",
        select: "fieldID bookingID",
        populate: [
          {
            path: "fieldID",
            select: "fieldName",
          },
          {
            path: "bookingID",
            select: "customerID",
            populate: {
              path: "customerID",
              select: "name image",
            },
          },
        ],
      });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      feedbacks,
      averageRating,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
      },
    };
  } catch (error) {
    throw {
      statusCode: 500,
      message: "Error retrieving feedback",
      error: error.message,
    };
  }
};

/**
 * Service: Get feedback by field with pagination
 */
const getFeedbackByField = async (fieldId, page = 1, limit = 10) => {
  try {
    if (!fieldId) {
      throw { statusCode: 400, message: "Field ID is required" };
    }

    // Validate pagination
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.max(1, Math.min(50, parseInt(limit) || 10));

    const skip = (page - 1) * limit;

    // Find all BookingDetails for this field
    const bookingDetails = await BookingDetail.find({
      fieldID: fieldId,
    }).select("_id");
    const bookingDetailIds = bookingDetails.map((bd) => bd._id);

    if (bookingDetailIds.length === 0) {
      return {
        feedbacks: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    // Get total count
    const total = await Feedback.countDocuments({
      bookingDetailID: { $in: bookingDetailIds },
    });

    // Calculate average rating
    const ratingStats = await Feedback.aggregate([
      {
        $match: {
          bookingDetailID: { $in: bookingDetailIds },
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rate" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const averageRating =
      ratingStats.length > 0
        ? parseFloat(ratingStats[0].averageRating.toFixed(1))
        : 0;

    // Get paginated feedback
    const feedbacks = await Feedback.find({
      bookingDetailID: { $in: bookingDetailIds },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      feedbacks,
      averageRating,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
      },
    };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || "Error retrieving field feedback",
    };
  }
};

/**
 * Service: Create feedback
 */
const createFeedback = async (customerId, feedbackData) => {
  try {
    const { bookingDetailID, rate, content } = feedbackData;

    // Validate required fields
    if (!bookingDetailID) {
      throw { statusCode: 400, message: "Booking Detail ID is required" };
    }

    if (rate === undefined || rate === null) {
      throw { statusCode: 400, message: "Rating is required" };
    }

    if (!content) {
      throw { statusCode: 400, message: "Feedback content is required" };
    }

    // Validate rating
    if (!isValidRating(rate)) {
      throw { statusCode: 400, message: "Rating must be between 1 and 5" };
    }

    // Validate content
    if (!isValidText(content, 10, 500)) {
      throw {
        statusCode: 400,
        message: "Feedback content must be between 10 and 500 characters",
      };
    }

    // Check if BookingDetail exists and belongs to this customer
    const bookingDetail = await BookingDetail.findById(
      bookingDetailID,
    ).populate({
      path: "bookingID",
      select: "customerID",
    });

    if (!bookingDetail) {
      throw { statusCode: 404, message: "Booking Detail not found" };
    }

    // Check if BookingDetail status is Completed
    if (bookingDetail.status !== "Completed") {
      throw {
        statusCode: 400,
        message: `Cannot create feedback. Booking Detail status must be 'Completed', current status: '${bookingDetail.status}'`,
      };
    }

    if (bookingDetail.bookingID.customerID.toString() !== customerId) {
      throw {
        statusCode: 403,
        message: "Unauthorized to create feedback for this booking",
      };
    }

    // Create feedback
    const newFeedback = new Feedback({
      bookingDetailID,
      rate: parseInt(rate),
      content: content.trim(),
    });

    await newFeedback.save();

    // Populate and return
    const populatedFeedback = await Feedback.findById(newFeedback._id).populate(
      {
        path: "bookingDetailID",
        select: "fieldID bookingID startTime endTime",
        populate: [
          {
            path: "fieldID",
            select: "fieldName address",
          },
          {
            path: "bookingID",
            select: "customerID",
            populate: {
              path: "customerID",
              select: "name image",
            },
          },
        ],
      },
    );

    return { feedback: populatedFeedback };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || "Error creating feedback",
    };
  }
};

/**
 * Service: Update feedback
 */
const updateFeedback = async (customerId, feedbackId, updateData) => {
  try {
    const { rate, content } = updateData;

    // Check if feedback exists
    const feedback = await Feedback.findById(feedbackId).populate({
      path: "bookingDetailID",
      populate: { path: "bookingID", select: "customerID" },
    });

    if (!feedback) {
      throw { statusCode: 404, message: "Feedback not found" };
    }

    // Check if BookingDetail status is Completed
    if (feedback.bookingDetailID.status !== "Completed") {
      throw {
        statusCode: 400,
        message: `Cannot update feedback. Booking Detail status must be 'Completed', current status: '${feedback.bookingDetailID.status}'`,
      };
    }

    // Check ownership
    if (
      feedback.bookingDetailID.bookingID.customerID.toString() !== customerId
    ) {
      throw {
        statusCode: 403,
        message: "Unauthorized to update this feedback",
      };
    }

    // Update fields if provided
    if (rate !== undefined && rate !== null) {
      if (!isValidRating(rate)) {
        throw { statusCode: 400, message: "Rating must be between 1 and 5" };
      }
      feedback.rate = parseInt(rate);
    }

    if (content !== undefined && content !== null) {
      if (!isValidText(content, 10, 500)) {
        throw {
          statusCode: 400,
          message: "Feedback content must be between 10 and 500 characters",
        };
      }
      feedback.content = content.trim();
    }

    await feedback.save();

    // Return updated feedback
    const updatedFeedback = await Feedback.findById(feedbackId).populate({
      path: "bookingDetailID",
      select: "fieldID bookingID startTime endTime",
      populate: [
        {
          path: "fieldID",
          select: "fieldName address",
        },
        {
          path: "bookingID",
          select: "customerID",
          populate: {
            path: "customerID",
            select: "name image",
          },
        },
      ],
    });

    return { feedback: updatedFeedback };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || "Error updating feedback",
    };
  }
};

/**
 * Service: Delete feedback
 */
const deleteFeedback = async (customerId, feedbackId) => {
  try {
    const feedback = await Feedback.findById(feedbackId).populate({
      path: "bookingDetailID",
      populate: { path: "bookingID", select: "customerID" },
    });

    if (!feedback) {
      throw { statusCode: 404, message: "Feedback not found" };
    }

    // Check ownership
    if (
      feedback.bookingDetailID.bookingID.customerID.toString() !== customerId
    ) {
      throw {
        statusCode: 403,
        message: "Unauthorized to delete this feedback",
      };
    }

    await Feedback.findByIdAndDelete(feedbackId);

    return { message: "Feedback deleted successfully" };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || "Error deleting feedback",
    };
  }
};

/**
 * Service: Get feedback statistics for a field
 */
const getFieldFeedbackStats = async (fieldId) => {
  try {
    if (!fieldId) {
      throw { statusCode: 400, message: "Field ID is required" };
    }

    // Find all BookingDetails for this field
    const bookingDetails = await BookingDetail.find({
      fieldID: fieldId,
    }).select("_id");
    const bookingDetailIds = bookingDetails.map((bd) => bd._id);

    if (bookingDetailIds.length === 0) {
      return {
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    // Get all feedbacks for field
    const feedbacks = await Feedback.find({
      bookingDetailID: { $in: bookingDetailIds },
    });

    if (feedbacks.length === 0) {
      return {
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    // Calculate statistics
    const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rate, 0);
    const averageRating = (totalRating / feedbacks.length).toFixed(2);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((fb) => {
      ratingDistribution[fb.rate]++;
    });

    return {
      totalFeedbacks: feedbacks.length,
      averageRating: parseFloat(averageRating),
      ratingDistribution,
    };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || "Error calculating feedback statistics",
    };
  }
};

module.exports = {
  getAllFeedback,
  getFeedbackByField,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFieldFeedbackStats,
};
