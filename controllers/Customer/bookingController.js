const bookingService = require('../../services/Customer/bookingService');

/**
 * Controller: Get field availability
 */
const getFieldAvailability = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày (date parameter)'
      });
    }

    const result = await bookingService.getFieldAvailability(fieldId, date);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get Field Availability Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi lấy thông tin sân';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Controller: Create booking
 */
const createBooking = async (req, res) => {
  try {
    const customerId = req.userId;
    const bookingData = req.body;

    const result = await bookingService.createBooking(customerId, bookingData);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Create Booking Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi tạo booking';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Controller: Get customer bookings
 */
const getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.userId;

    const result = await bookingService.getCustomerBookings(customerId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get Customer Bookings Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi lấy danh sách booking';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Controller: Update booking detail status (by manager)
 */
const updateBookingDetailStatus = async (req, res) => {
  try {
    const { bookingDetailId } = req.params;
    const { status } = req.body;
    const managerId = req.userId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái mới'
      });
    }

    const result = await bookingService.updateBookingDetailStatus(bookingDetailId, status, managerId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.bookingDetail
    });
  } catch (error) {
    console.error('Update Booking Detail Status Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi cập nhật trạng thái';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Controller: Cancel booking (by customer)
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const customerId = req.userId;

    const result = await bookingService.cancelBooking(customerId, bookingId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.booking
    });
  } catch (error) {
    console.error('Cancel Booking Error:', error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi hủy booking';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
};

module.exports = {
  getFieldAvailability,
  createBooking,
  getCustomerBookings,
  updateBookingDetailStatus,
  cancelBooking
};
