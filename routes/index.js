const express = require('express');
const router = express.Router();

// Import auth routes
const managerAuthRoutes = require('./Manager/authRoutes');
const customerAuthRoutes = require('./Customer/authRoutes');

// Import profile routes
const managerProfileRoutes = require('./Manager/profileRoutes');
const customerProfileRoutes = require('./Customer/profileRoutes');

// Import dashboard routes
const managerDashboardRoutes = require('./Manager/dashboardRoutes');

// Import customer management routes
const managerCustomerRoutes = require('./Manager/customerRoutes');

// Import feedback routes
const feedbackRoutes = require('./feedbackRoutes');

// Auth routes
router.use('/api/manager/auth', managerAuthRoutes);
router.use('/api/customer/auth', customerAuthRoutes);

// Profile routes
router.use('/api/manager/profile', managerProfileRoutes);
router.use('/api/customer/profile', customerProfileRoutes);

// Dashboard routes
router.use('/api/manager/dashboard', managerDashboardRoutes);

// Customer management routes (Manager)
router.use('/api/manager/customers', managerCustomerRoutes);

// Feedback routes
router.use('/api/feedback', feedbackRoutes);

module.exports = router;
