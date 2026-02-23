const express = require('express');
const router = express.Router();

// Import auth routes
const managerAuthRoutes = require('./Manager/authRoutes');
const customerAuthRoutes = require('./Customer/authRoutes');

// Import profile routes
const managerProfileRoutes = require('./Manager/profileRoutes');
const customerProfileRoutes = require('./Customer/profileRoutes');

// Import field routes
const managerFieldRoutes = require('./Manager/fieldRoutes');

// Auth routes
router.use('/api/manager/auth', managerAuthRoutes);
router.use('/api/customer/auth', customerAuthRoutes);

// Profile routes
router.use('/api/manager/profile', managerProfileRoutes);
router.use('/api/customer/profile', customerProfileRoutes);

// Field routes
router.use('/api/manager/field', managerFieldRoutes);

module.exports = router;
