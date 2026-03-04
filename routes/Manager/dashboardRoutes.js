const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/Manager/dashboardController');
const { verifyToken, isManager } = require('../../middlewares/auth');

// Main dashboard stats - all data combined
router.get('/stats', verifyToken, isManager, dashboardController.getDashboardStats);

// Summary stats
router.get('/summary', verifyToken, isManager, dashboardController.getSummaryStats);

// Booking status breakdown
router.get('/bookings/status', verifyToken, isManager, dashboardController.getBookingStatusBreakdown);

// Payment status breakdown
router.get('/bookings/payment-status', verifyToken, isManager, dashboardController.getPaymentStatusBreakdown);

// Revenue by month
router.get('/revenue/month', verifyToken, isManager, dashboardController.getRevenueByMonth);

// Revenue by week
router.get('/revenue/week', verifyToken, isManager, dashboardController.getRevenueByWeek);

// Revenue by category (all categories)
router.get('/revenue/category', verifyToken, isManager, dashboardController.getRevenueByCategory);

// Revenue by field type (with optional category filter)
router.get('/revenue/field-type', verifyToken, isManager, dashboardController.getRevenueByFieldType);

// Get all categories for filtering
router.get('/categories', verifyToken, isManager, dashboardController.getCategories);

// Top fields
router.get('/top-fields', verifyToken, isManager, dashboardController.getTopFields);

// Top customers
router.get('/top-customers', verifyToken, isManager, dashboardController.getTopCustomers);

// Recent bookings
router.get('/recent-bookings', verifyToken, isManager, dashboardController.getRecentBookings);

module.exports = router;
