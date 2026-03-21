const mongoose = require("mongoose");
const Field = require("../../models/Field");
const Booking = require("../../models/Booking");
const BookingDetail = require("../../models/BookingDetail");

/**
 * Get all bookings for fields managed by this manager
 * Optional: filter by customerId
 */
const getAllBookings = async (managerId, customerId = null) => {
  // Get all fields managed by this manager
  const fields = await Field.find({ managerID: managerId }).select("_id");
  const fieldIds = fields.map((f) => f._id);

  if (fieldIds.length === 0) {
    return [];
  }

  // Build query
  let bookingQuery = {};
  if (customerId) {
    bookingQuery.customerID = customerId;
  }

  // Get all bookings
  const bookings = await Booking.find(bookingQuery)
    .sort({ createdAt: -1 })
    .populate({
      path: "customerID",
      select: "name email phone image",
    });

  // Filter bookings that have at least one detail in manager's fields
  const bookingsWithDetails = await Promise.all(
    bookings.map(async (booking) => {
      const details = await BookingDetail.find({
        bookingID: booking._id,
        fieldID: { $in: fieldIds }, // Only details for this manager's fields
      })
        .populate("fieldID")
        .sort({ startTime: 1 });

      // Only return booking if it has details in this manager's fields
      if (details.length === 0) {
        return null;
      }

      // Tính toán các thông tin thanh toán
      const completedPrice = details
        .filter((bd) => bd.status === "Completed")
        .reduce((sum, bd) => sum + bd.priceSnapshot, 0);

      const activePrice = details
        .filter((bd) => bd.status === "Active")
        .reduce((sum, bd) => sum + bd.priceSnapshot, 0);

      // Số tiền còn phải trả
      let remainingAmount = 0;
      if (booking.status === "Pending") {
        // Chưa trả gì - cần trả cọc
        remainingAmount = booking.depositAmount;
      } else if (
        booking.status === "Confirmed" &&
        booking.statusPayment === "Unpaid"
      ) {
        // Đã trả cọc - còn phải trả phần còn lại
        remainingAmount = Math.max(
          0,
          booking.totalPrice - booking.depositAmount,
        );
      }

      return {
        id: booking._id,
        customer: {
          id: booking.customerID._id,
          name: booking.customerID.name,
          email: booking.customerID.email,
          phone: booking.customerID.phone,
          image: booking.customerID.image || "",
        },
        totalPrice: booking.totalPrice,
        depositAmount: booking.depositAmount,
        status: booking.status,
        statusPayment: booking.statusPayment,
        createdAt: booking.createdAt,

        // Thông tin thanh toán bổ sung
        paymentInfo: {
          completedPrice: completedPrice,
          activePrice: activePrice,
          remainingAmount: remainingAmount,
        },

        // Flags hữu ích
        needConfirmDeposit: booking.status === "Pending",
        needConfirmPayment:
          booking.status === "Confirmed" && booking.statusPayment === "Unpaid", // Manager có thể confirm bất cứ lúc nào

        bookingDetails: details.map((bd) => ({
          id: bd._id,
          fieldId: bd.fieldID?._id || bd.fieldID,
          fieldName: bd.fieldID?.fieldName || "",
          fieldAddress: bd.fieldID?.address || "",
          startTime: bd.startTime,
          endTime: bd.endTime,
          price: bd.priceSnapshot,
          status: bd.status,
        })),
      };
    }),
  );

  // Filter out null values
  return bookingsWithDetails.filter((b) => b !== null);
};

/**
 * Confirm deposit received (Pending → Confirmed)
 */
const confirmDeposit = async (managerId, bookingId) => {
  const booking = await Booking.findById(bookingId).populate("customerID");

  if (!booking) {
    throw { statusCode: 404, message: "Booking không tồn tại" };
  }

  // Verify manager owns this booking's field
  const bookingDetails = await BookingDetail.find({
    bookingID: bookingId,
  }).populate("fieldID");
  if (bookingDetails.length === 0) {
    throw { statusCode: 404, message: "Booking không có chi tiết" };
  }

  const field = bookingDetails[0].fieldID;
  if (field.managerID.toString() !== managerId.toString()) {
    throw {
      statusCode: 403,
      message: "Bạn không có quyền xác nhận booking này",
    };
  }

  // Only allow confirm when Pending
  if (booking.status !== "Pending") {
    throw {
      statusCode: 400,
      message: "Chỉ có thể xác nhận tiền cọc khi booking đang Pending",
    };
  }

  // Update status
  booking.status = "Confirmed";
  await booking.save();

  // Send email notification
  try {
    const { sendDepositConfirmedEmail } = require("../../utils/emailConfig");
    if (booking.customerID) {
      await sendDepositConfirmedEmail(booking.customerID, booking, field);
    }
  } catch (emailError) {
    console.error("Error sending deposit confirmation email:", emailError);
  }

  return {
    message: "Xác nhận tiền cọc thành công",
    booking: {
      id: booking._id,
      status: booking.status,
      statusPayment: booking.statusPayment,
    },
  };
};

/**
 * Confirm payment received (Unpaid → Paid)
 * Manager có thể xác nhận bất cứ lúc nào (không cần đợi hết slots completed)
 */
const confirmPayment = async (managerId, bookingId) => {
  const booking = await Booking.findById(bookingId).populate("customerID");

  if (!booking) {
    throw { statusCode: 404, message: "Booking không tồn tại" };
  }

  // Verify manager owns this booking's field
  const bookingDetails = await BookingDetail.find({
    bookingID: bookingId,
  }).populate("fieldID");
  if (bookingDetails.length === 0) {
    throw { statusCode: 404, message: "Booking không có chi tiết" };
  }

  const field = bookingDetails[0].fieldID;
  if (field.managerID.toString() !== managerId.toString()) {
    throw {
      statusCode: 403,
      message: "Bạn không có quyền xác nhận thanh toán này",
    };
  }

  // Only allow confirm when Confirmed + Unpaid
  if (booking.status !== "Confirmed") {
    throw { statusCode: 400, message: "Booking phải ở trạng thái Confirmed" };
  }

  if (booking.statusPayment !== "Unpaid") {
    throw { statusCode: 400, message: "Booking đã được thanh toán rồi" };
  }

  // Update payment status (KHÔNG cần điều kiện slots completed)
  booking.statusPayment = "Paid";
  await booking.save();

  // Send email notification
  try {
    const { sendPaymentConfirmedEmail } = require("../../utils/emailConfig");
    if (booking.customerID) {
      await sendPaymentConfirmedEmail(booking.customerID, booking, field);
    }
  } catch (emailError) {
    console.error("Error sending payment confirmation email:", emailError);
  }

  return {
    message: "Xác nhận thanh toán thành công",
    booking: {
      id: booking._id,
      status: booking.status,
      statusPayment: booking.statusPayment,
    },
  };
};

/**
 * Cancel a booking (Pending → Cancelled) when deposit not received
 */
const cancelBooking = async (managerId, bookingId) => {
  const booking = await Booking.findById(bookingId).populate('customerID');
  if (!booking) throw { statusCode: 404, message: 'Booking không tồn tại' };

  const bookingDetails = await BookingDetail.find({ bookingID: bookingId }).populate('fieldID');
  if (bookingDetails.length === 0) throw { statusCode: 404, message: 'Booking không có chi tiết' };

  const field = bookingDetails[0].fieldID;
  if (field.managerID.toString() !== managerId.toString())
    throw { statusCode: 403, message: 'Bạn không có quyền hủy booking này' };

  if (booking.status !== 'Pending')
    throw { statusCode: 400, message: 'Chỉ có thể hủy booking đang ở trạng thái Pending' };

  // Preserve amounts for email content (service resets amounts after cancellation)
  const originalTotalPrice = booking.totalPrice;
  const originalDepositAmount = booking.depositAmount;

  booking.status = 'Cancelled';
  booking.totalPrice = 0;
  booking.depositAmount = 0;
  await booking.save();

  await BookingDetail.updateMany(
    { bookingID: bookingId, status: 'Active' },
    { status: 'Cancelled' }
  );

  // Send email notification (booking cancelled due to not receiving deposit)
  try {
    const { sendBookingCancelledDueToNoDepositEmail } = require('../../utils/emailConfig');
    if (booking.customerID) {
      await sendBookingCancelledDueToNoDepositEmail(
        booking.customerID,
        {
          _id: booking._id,
          totalPrice: originalTotalPrice,
          depositAmount: originalDepositAmount,
        },
        bookingDetails,
        field,
      );
    }
  } catch (emailError) {
    console.error('Error sending booking cancellation (no deposit) email:', emailError);
  }

  return {
    message: 'Đã hủy booking do không nhận được tiền cọc',
    booking: { id: booking._id, status: booking.status, statusPayment: booking.statusPayment },
  };
};

module.exports = {
  getAllBookings,
  confirmDeposit,
  confirmPayment,
  cancelBooking,
};
