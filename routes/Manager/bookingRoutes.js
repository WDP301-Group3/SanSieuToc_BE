const express = require('express');
const router = express.Router();
const customerBookingController = require('../../controllers/Customer/bookingController');
const managerBookingController = require('../../controllers/Manager/bookingController');
const { verifyToken, isManager } = require('../../middlewares/auth');

// Manager routes (require authentication)

// Get all bookings for manager's fields (optional filter by customerId)
router.get('/bookings', verifyToken, isManager, managerBookingController.getAllBookings);

// Confirm deposit received (Pending → Confirmed)
router.put('/bookings/:bookingId/confirm-deposit', verifyToken, isManager, managerBookingController.confirmDeposit);

// Confirm payment received (Unpaid → Paid)
router.put('/bookings/:bookingId/confirm-payment', verifyToken, isManager, managerBookingController.confirmPayment);

// Update booking detail status
router.put('/booking-details/:bookingDetailId/status', verifyToken, isManager, customerBookingController.updateBookingDetailStatus);

module.exports = router;
