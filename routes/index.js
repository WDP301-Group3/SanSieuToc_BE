const express = require('express');
const router = express.Router();

// Import auth routes
const managerAuthRoutes = require('./Manager/authRoutes');
const customerAuthRoutes = require('./Customer/authRoutes');

// Import profile routes
const managerProfileRoutes = require('./Manager/profileRoutes');
const customerProfileRoutes = require('./Customer/profileRoutes');

// Import field routes

// Import booking routes
const customerBookingRoutes = require('./Customer/bookingRoutes');
const managerBookingRoutes = require('./Manager/bookingRoutes');

const managerFieldRoutes = require('./Manager/fieldRoutes');
const customerFieldRoutes = require('./Customer/fieldRoutes');

// Auth routes
router.use('/api/manager/auth', managerAuthRoutes);
router.use('/api/customer/auth', customerAuthRoutes);

// Profile routes
router.use('/api/manager/profile', managerProfileRoutes);
router.use('/api/customer/profile', customerProfileRoutes);

// Field routes

// Booking routes
router.use('/api/customer', customerBookingRoutes);
router.use('/api/manager', managerBookingRoutes);
router.use('/api/manager/field', managerFieldRoutes);
router.use('/api/field', customerFieldRoutes); // Public field routes for customers


module.exports = router;
