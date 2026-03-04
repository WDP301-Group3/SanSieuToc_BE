const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/Customer/bookingController');
const { verifyToken, isCustomer } = require('../../middlewares/auth');

// Public routes
router.get('/fields/:fieldId/availability', bookingController.getFieldAvailability);

// Customer routes (require authentication)
router.post('/bookings', verifyToken, isCustomer, bookingController.createBooking);
router.get('/bookings/my-bookings', verifyToken, isCustomer, bookingController.getCustomerBookings);
router.put('/bookings/:bookingId/cancel', verifyToken, isCustomer, bookingController.cancelBooking);

module.exports = router;
