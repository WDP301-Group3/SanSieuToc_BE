const bookingService = require('../../services/Manager/bookingService');

/**
 * Get all bookings for manager's fields
 * Query params: customerId (optional)
 */
const getAllBookings = async (req, res) => {
  try {
    const managerId = req.userId;
    const { customerId } = req.query;

    const bookings = await bookingService.getAllBookings(managerId, customerId);

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error getting all bookings:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server'
    });
  }
};

/**
 * Confirm deposit received (Pending → Confirmed)
 */
const confirmDeposit = async (req, res) => {
  try {
    const managerId = req.userId;
    const { bookingId } = req.params;

    const result = await bookingService.confirmDeposit(managerId, bookingId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.booking
    });
  } catch (error) {
    console.error('Error confirming deposit:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server'
    });
  }
};

/**
 * Confirm payment received (Unpaid → Paid)
 */
const confirmPayment = async (req, res) => {
  try {
    const managerId = req.userId;
    const { bookingId } = req.params;

    const result = await bookingService.confirmPayment(managerId, bookingId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.booking
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi server'
    });
  }
};

module.exports = {
  getAllBookings,
  confirmDeposit,
  confirmPayment
};
