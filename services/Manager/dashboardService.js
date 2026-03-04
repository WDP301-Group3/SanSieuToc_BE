const Field = require('../../models/Field');
const Customer = require('../../models/Customer');
const Feedback = require('../../models/Feedback');
const Booking = require('../../models/Booking');
const BookingDetail = require('../../models/BookingDetail');

/**
 * Service: Get dashboard statistics for Manager
 */
const getDashboardStats = async () => {
  try {
    // Get total counts
    const totalFields = await Field.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalFeedbacks = await Feedback.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Get booking status breakdown
    const bookingStatusBreakdown = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get payment status breakdown
    const paymentStatusBreakdown = await Booking.aggregate([
      {
        $group: {
          _id: '$statusPayment',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total revenue and paid revenue
    const revenueStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalDeposit: { $sum: '$depositAmount' },
          totalPaidRevenue: {
            $sum: {
              $cond: [{ $eq: ['$statusPayment', 'Paid'] }, '$totalPrice', 0]
            }
          }
        }
      }
    ]);

    // Get feedback rating statistics
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get average feedback rating
    const avgRating = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Get bookings by month (last 6 months)
    const bookingsByMonth = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get bookings by week (last 12 weeks)
    const bookingsByWeek = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $isoDayOfWeek: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
            isoYear: { $isoWeekYear: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
          startDate: { $min: '$createdAt' }
        }
      },
      { $sort: { '_id.isoYear': 1, '_id.week': 1 } }
    ]);

    // Get revenue by field type
    const revenueByFieldType = await BookingDetail.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingID',
          foreignField: '_id',
          as: 'bookingInfo'
        }
      },
      { $unwind: '$bookingInfo' },
      {
        $lookup: {
          from: 'fields',
          localField: 'fieldID',
          foreignField: '_id',
          as: 'fieldInfo'
        }
      },
      { $unwind: '$fieldInfo' },
      {
        $lookup: {
          from: 'fieldtypes',
          localField: 'fieldInfo.fieldTypeID',
          foreignField: '_id',
          as: 'fieldTypeInfo'
        }
      },
      { $unwind: '$fieldTypeInfo' },
      {
        $group: {
          _id: {
            fieldTypeID: '$fieldTypeInfo._id',
            typeName: '$fieldTypeInfo.typeName'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$bookingInfo.totalPrice' },
          totalDeposit: { $sum: '$bookingInfo.depositAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          fieldTypeID: '$_id.fieldTypeID',
          typeName: '$_id.typeName',
          count: '$count',
          totalRevenue: '$totalRevenue',
          totalDeposit: '$totalDeposit'
        }
      }
    ]);

    // Format booking status breakdown
    const statusBreakdown = {};
    bookingStatusBreakdown.forEach(item => {
      statusBreakdown[item._id] = item.count;
    });

    // Format payment status breakdown
    const paymentBreakdown = {};
    paymentStatusBreakdown.forEach(item => {
      paymentBreakdown[item._id] = item.count;
    });

    return {
      // Summary cards
      summary: {
        totalFields,
        totalCustomers,
        totalFeedbacks,
        totalBookings
      },
      // Booking statistics
      bookingStats: {
        total: totalBookings,
        statusBreakdown: statusBreakdown,
        paymentBreakdown: paymentBreakdown
      },
      // Revenue statistics
      revenueStats: revenueStats[0] || {
        totalRevenue: 0,
        totalDeposit: 0,
        totalPaidRevenue: 0
      },
      // Feedback statistics
      feedbackStats: {
        ratingBreakdown: feedbackStats,
        averageRating: avgRating[0]?.averageRating || 0,
        totalFeedbacks
      },
      // Trend data - by month
      revenueByMonth: bookingsByMonth,
      // Trend data - by week
      revenueByWeek: bookingsByWeek,
      // Revenue breakdown - by field type
      revenueByFieldType: revenueByFieldType
    };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Error retrieving dashboard statistics',
      error: error.message
    };
  }
};

/**
 * Get booking status breakdown
 */
const getBookingStatusBreakdown = async () => {
  try {
    const statusBreakdown = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    statusBreakdown.forEach(item => {
      result[item._id] = item.count;
    });

    return result;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving booking status breakdown',
      error: error.message
    };
  }
};

/**
 * Get payment status breakdown
 */
const getPaymentStatusBreakdown = async () => {
  try {
    const paymentBreakdown = await Booking.aggregate([
      {
        $group: {
          _id: '$statusPayment',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    paymentBreakdown.forEach(item => {
      result[item._id] = item.count;
    });

    return result;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving payment status breakdown',
      error: error.message
    };
  }
};

/**
 * Get revenue by month
 */
const getRevenueByMonth = async () => {
  try {
    const data = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
          deposit: { $sum: '$depositAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return data;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving revenue by month',
      error: error.message
    };
  }
};

/**
 * Get revenue by week
 */
const getRevenueByWeek = async () => {
  try {
    const data = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 16 * 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            isoYear: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
          deposit: { $sum: '$depositAmount' }
        }
      },
      { $sort: { '_id.isoYear': 1, '_id.week': 1 } }
    ]);

    return data;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving revenue by week',
      error: error.message
    };
  }
};

/**
 * Get revenue by field type
 * @param {String} categoryName - Optional category filter (e.g., "sân bóng đá", "cầu lông")
 */
const getRevenueByFieldType = async (categoryName = null) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingID',
          foreignField: '_id',
          as: 'bookingInfo'
        }
      },
      { $unwind: '$bookingInfo' },
      {
        $lookup: {
          from: 'fields',
          localField: 'fieldID',
          foreignField: '_id',
          as: 'fieldInfo'
        }
      },
      { $unwind: '$fieldInfo' },
      {
        $lookup: {
          from: 'fieldtypes',
          localField: 'fieldInfo.fieldTypeID',
          foreignField: '_id',
          as: 'fieldTypeInfo'
        }
      },
      { $unwind: '$fieldTypeInfo' },
      {
        $lookup: {
          from: 'categories',
          localField: 'fieldTypeInfo.categoryID',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' }
    ];

    // Add filter by category name if provided
    if (categoryName) {
      pipeline.push({
        $match: {
          'categoryInfo.categoryName': categoryName
        }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: {
            fieldTypeID: '$fieldTypeInfo._id',
            typeName: '$fieldTypeInfo.typeName',
            categoryID: '$categoryInfo._id',
            categoryName: '$categoryInfo.categoryName'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$bookingInfo.totalPrice' },
          totalDeposit: { $sum: '$bookingInfo.depositAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          fieldTypeID: '$_id.fieldTypeID',
          typeName: '$_id.typeName',
          categoryID: '$_id.categoryID',
          categoryName: '$_id.categoryName',
          count: '$count',
          totalRevenue: '$totalRevenue',
          totalDeposit: '$totalDeposit'
        }
      }
    );

    const data = await BookingDetail.aggregate(pipeline);

    return data;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving revenue by field type',
      error: error.message
    };
  }
};

/**
 * Get top fields by revenue
 */
const getTopFields = async (limit = 10) => {
  try {
    const data = await BookingDetail.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingID',
          foreignField: '_id',
          as: 'bookingInfo'
        }
      },
      { $unwind: '$bookingInfo' },
      {
        $lookup: {
          from: 'fields',
          localField: 'fieldID',
          foreignField: '_id',
          as: 'fieldInfo'
        }
      },
      { $unwind: '$fieldInfo' },
      {
        $group: {
          _id: '$fieldInfo._id',
          fieldName: { $first: '$fieldInfo.fieldName' },
          hourlyPrice: { $first: '$fieldInfo.hourlyPrice' },
          totalRevenue: { $sum: '$bookingInfo.totalPrice' },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);

    return data;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving top fields',
      error: error.message
    };
  }
};

/**
 * Get top customers by spending
 */
const getTopCustomers = async (limit = 10) => {
  try {
    const data = await Booking.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customerID',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' },
      {
        $group: {
          _id: '$customerInfo._id',
          customerName: { $first: '$customerInfo.customerName' },
          email: { $first: '$customerInfo.email' },
          totalSpent: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit }
    ]);

    return data;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving top customers',
      error: error.message
    };
  }
};

/**
 * Get recent bookings
 */
const getRecentBookings = async (limit = 20) => {
  try {
    const data = await Booking.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customerID',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' },
      {
        $lookup: {
          from: 'bookingdetails',
          localField: '_id',
          foreignField: 'bookingID',
          as: 'bookingDetails'
        }
      },
      {
        $project: {
          _id: 1,
          customerName: '$customerInfo.customerName',
          email: '$customerInfo.email',
          totalPrice: 1,
          status: 1,
          statusPayment: 1,
          createdAt: 1,
          bookingCount: { $size: '$bookingDetails' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit }
    ]);

    return data;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving recent bookings',
      error: error.message
    };
  }
};

/**
 * Get summary stats
 */
const getSummaryStats = async () => {
  try {
    const totalFields = await Field.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalFeedbacks = await Feedback.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const revenueStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalDeposit: { $sum: '$depositAmount' },
          totalPaidRevenue: {
            $sum: {
              $cond: [{ $eq: ['$statusPayment', 'Paid'] }, '$totalPrice', 0]
            }
          }
        }
      }
    ]);

    return {
      totalFields,
      totalCustomers,
      totalFeedbacks,
      totalBookings,
      revenueStats: revenueStats[0] || {
        totalRevenue: 0,
        totalDeposit: 0,
        totalPaidRevenue: 0
      }
    };
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving summary stats',
      error: error.message
    };
  }
};

/**
 * Get all categories for filtering
 */
const getCategories = async () => {
  try {
    const Category = require('../../models/Category');
    const categories = await Category.find().select('_id categoryName');
    return categories;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving categories',
      error: error.message
    };
  }
};

/**
 * Get revenue by category with field types breakdown
 */
const getRevenueByCategory = async () => {
  try {
    const data = await BookingDetail.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingID',
          foreignField: '_id',
          as: 'bookingInfo'
        }
      },
      { $unwind: '$bookingInfo' },
      {
        $lookup: {
          from: 'fields',
          localField: 'fieldID',
          foreignField: '_id',
          as: 'fieldInfo'
        }
      },
      { $unwind: '$fieldInfo' },
      {
        $lookup: {
          from: 'fieldtypes',
          localField: 'fieldInfo.fieldTypeID',
          foreignField: '_id',
          as: 'fieldTypeInfo'
        }
      },
      { $unwind: '$fieldTypeInfo' },
      {
        $lookup: {
          from: 'categories',
          localField: 'fieldTypeInfo.categoryID',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: {
            categoryID: '$categoryInfo._id',
            categoryName: '$categoryInfo.categoryName'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$bookingInfo.totalPrice' },
          totalDeposit: { $sum: '$bookingInfo.depositAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          categoryID: '$_id.categoryID',
          categoryName: '$_id.categoryName',
          count: '$count',
          totalRevenue: '$totalRevenue',
          totalDeposit: '$totalDeposit'
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    return data;
  } catch (error) {
    throw {
      statusCode: error.statusCode || 500,
      message: 'Error retrieving revenue by category',
      error: error.message
    };
  }
};

module.exports = {
  getDashboardStats,
  getBookingStatusBreakdown,
  getPaymentStatusBreakdown,
  getRevenueByMonth,
  getRevenueByWeek,
  getRevenueByFieldType,
  getTopFields,
  getTopCustomers,
  getRecentBookings,
  getSummaryStats,
  getCategories,
  getRevenueByCategory
};
