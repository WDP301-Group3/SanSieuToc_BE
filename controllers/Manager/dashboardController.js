const dashboardService = require('../../services/Manager/dashboardService');

/**
 * Controller: Get dashboard statistics for Manager
 */
const getDashboardStats = async (req, res) => {
  try {
    const result = await dashboardService.getDashboardStats();

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving dashboard statistics';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get booking status breakdown
 */
const getBookingStatusBreakdown = async (req, res) => {
  try {
    const result = await dashboardService.getBookingStatusBreakdown();

    res.status(200).json({
      success: true,
      message: 'Booking status breakdown retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Booking Status Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving booking status';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get payment status breakdown
 */
const getPaymentStatusBreakdown = async (req, res) => {
  try {
    const result = await dashboardService.getPaymentStatusBreakdown();

    res.status(200).json({
      success: true,
      message: 'Payment status breakdown retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Payment Status Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving payment status';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get revenue by month
 */
const getRevenueByMonth = async (req, res) => {
  try {
    const result = await dashboardService.getRevenueByMonth();

    res.status(200).json({
      success: true,
      message: 'Revenue by month retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Revenue By Month Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving revenue by month';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get revenue by week
 */
const getRevenueByWeek = async (req, res) => {
  try {
    const result = await dashboardService.getRevenueByWeek();

    res.status(200).json({
      success: true,
      message: 'Revenue by week retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Revenue By Week Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving revenue by week';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get revenue by field type
 */
const getRevenueByFieldType = async (req, res) => {
  try {
    const categoryName = req.query.categoryName || null;
    const result = await dashboardService.getRevenueByFieldType(categoryName);

    res.status(200).json({
      success: true,
      message: 'Revenue by field type retrieved successfully',
      filter: categoryName ? { categoryName } : null,
      data: result
    });
  } catch (error) {
    console.error('Get Revenue By Field Type Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving revenue by field type';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get top fields
 */
const getTopFields = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const result = await dashboardService.getTopFields(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Top fields retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Top Fields Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving top fields';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get top customers
 */
const getTopCustomers = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const result = await dashboardService.getTopCustomers(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Top customers retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Top Customers Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving top customers';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get recent bookings
 */
const getRecentBookings = async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const result = await dashboardService.getRecentBookings(parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Recent bookings retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Recent Bookings Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving recent bookings';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get summary stats
 */
const getSummaryStats = async (req, res) => {
  try {
    const result = await dashboardService.getSummaryStats();

    res.status(200).json({
      success: true,
      message: 'Summary stats retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Summary Stats Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving summary stats';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get all categories for filtering
 */
const getCategories = async (req, res) => {
  try {
    const result = await dashboardService.getCategories();

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Categories Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving categories';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
  }
};

/**
 * Controller: Get revenue by category
 */
const getRevenueByCategory = async (req, res) => {
  try {
    const result = await dashboardService.getRevenueByCategory();

    res.status(200).json({
      success: true,
      message: 'Revenue by category retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get Revenue By Category Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while retrieving revenue by category';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.error || error.message
    });
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
