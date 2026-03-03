const mongoose = require('mongoose');
const Field = require('../../models/Field');
const Booking = require('../../models/Booking');
const BookingDetail = require('../../models/BookingDetail');
const {
  generateTimeSlots,
  generateDateTimeSlots,
  generateBookingDates,
  isPastDate,
  isPastDateTime,
  calculateSlotPrice,
  calculateDepositAmount,
  formatDate,
  formatDateTime
} = require('../../utils/bookingHelpers');
const { sendResetPasswordEmail } = require('../../utils/emailConfig');

/**
 * Get field availability for a specific date
 */
const getFieldAvailability = async (fieldId, date) => {
  // Validate field
  const field = await Field.findById(fieldId).populate('fieldTypeID');
  if (!field) {
    throw { statusCode: 404, message: 'Sân không tồn tại' };
  }

  if (field.status !== 'Maintenance') {
    throw { statusCode: 400, message: 'Sân đang bảo trì' };
  }

  // Check if date is in the past
  if (isPastDate(date)) {
    throw { statusCode: 400, message: 'Không thể xem lịch của ngày đã qua' };
  }

  // Generate time slots based on field settings
  const timeSlots = generateTimeSlots(
    field.openingTime,
    field.closingTime,
    field.slotDuration,
    10 // break time between slots
  );

  // Generate full datetime slots for the date
  const dateTimeSlots = generateDateTimeSlots(date, timeSlots);

  // Get booked slots for this date
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const bookedDetails = await BookingDetail.find({
    fieldID: fieldId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['Active', 'Pending'] }
  }).populate({
    path: 'bookingID',
    match: { status: { $ne: 'Cancelled' } }
  });

  // Filter out bookingDetails where booking was cancelled
  const activeBookedDetails = bookedDetails.filter(bd => bd.bookingID !== null);

  // Mark slots as available or not
  const slots = dateTimeSlots.map(slot => {
    const isBooked = activeBookedDetails.some(bd =>
      bd.startTime.getTime() === slot.startTime.getTime() &&
      bd.endTime.getTime() === slot.endTime.getTime()
    );

    const price = calculateSlotPrice(slot.startTime, slot.endTime, field.hourlyPrice);

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: field.slotDuration,
      isAvailable: !isBooked,
      price: price
    };
  });

  return {
    field: {
      id: field._id,
      name: field.fieldName,
      address: field.address,
      fieldType: field.fieldTypeID?.name || '',
      hourlyPrice: field.hourlyPrice,
      slotDuration: field.slotDuration,
      openingTime: field.openingTime,
      closingTime: field.closingTime
    },
    date: formatDate(date),
    slots: slots
  };
};

/**
 * Create booking
 */
const createBooking = async (customerId, bookingData) => {
  const {
    fieldId,
    startDate,
    selectedSlots, // Array of {startTime, endTime}
    repeatType, // "once", "weekly", "recurring"
    duration // 4, 8, 12 weeks (only for recurring)
  } = bookingData;

  // Validate field và populate manager để lấy QR code
  const field = await Field.findById(fieldId).populate('managerID');
  if (!field) {
    throw { statusCode: 404, message: 'Sân không tồn tại' };
  }

  if (field.status !== 'Available') {
    throw { statusCode: 400, message: 'Sân đang bảo trì' };
  }

  // Validate repeat type
  if (!['once', 'weekly', 'recurring'].includes(repeatType)) {
    throw { statusCode: 400, message: 'Loại lặp lại không hợp lệ' };
  }

  // Validate duration for recurring bookings
  if (repeatType === 'recurring') {
    if (![1, 2, 3].includes(duration)) {
      throw { statusCode: 400, message: 'Thời gian lặp phải là 1, 2 hoặc 3 tháng' };
    }
  }

  // Validate selected slots
  if (!selectedSlots || selectedSlots.length === 0) {
    throw { statusCode: 400, message: 'Vui lòng chọn ít nhất một khung giờ' };
  }

  // Generate booking dates based on repeat type
  const bookingDates = generateBookingDates(startDate, repeatType, duration);

  // Check if any date is in the past
  const pastDates = bookingDates.filter(date => isPastDate(date));
  if (pastDates.length > 0) {
    throw { statusCode: 400, message: 'Không thể đặt sân cho ngày đã qua' };
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bookingDetailsToCreate = [];
    let totalPrice = 0;

    // For each date
    for (const date of bookingDates) {
      const dateStr = formatDate(date);

      // For each selected slot
      for (const slot of selectedSlots) {
        // Parse slot times
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);

        const slotStartTime = new Date(date);
        slotStartTime.setHours(startHour, startMin, 0, 0);

        const slotEndTime = new Date(date);
        slotEndTime.setHours(endHour, endMin, 0, 0);

        // Check if slot is in the past
        if (isPastDateTime(slotStartTime)) {
          throw { statusCode: 400, message: `Không thể đặt slot ${slot.startTime} cho ngày ${dateStr} (đã qua)` };
        }

        // Validate slot format (must match field settings)
        const validSlots = generateTimeSlots(field.openingTime, field.closingTime, field.slotDuration, 10);
        const isValidSlot = validSlots.some(vs =>
          vs.startTime === slot.startTime && vs.endTime === slot.endTime
        );

        if (!isValidSlot) {
          throw { statusCode: 400, message: `Khung giờ ${slot.startTime}-${slot.endTime} không hợp lệ` };
        }

        // Check if slot is already booked
        const existingBooking = await BookingDetail.findOne({
          fieldID: fieldId,
          startTime: slotStartTime,
          endTime: slotEndTime,
          status: { $in: ['Active', 'Pending'] }
        }).populate({
          path: 'bookingID',
          match: { status: { $ne: 'Cancelled' } }
        }).session(session);

        if (existingBooking && existingBooking.bookingID) {
          throw {
            statusCode: 409,
            message: `Slot ${slot.startTime}-${slot.endTime} ngày ${dateStr} đã được đặt. Vui lòng chọn slot khác!`
          };
        }

        // Calculate price for this slot
        const slotPrice = calculateSlotPrice(slotStartTime, slotEndTime, field.hourlyPrice);
        totalPrice += slotPrice;

        bookingDetailsToCreate.push({
          fieldID: fieldId,
          startTime: slotStartTime,
          endTime: slotEndTime,
          priceSnapshot: slotPrice,
          status: 'Active'
        });
      }
    }

    // Calculate deposit (20% of total)
    const depositAmount = calculateDepositAmount(totalPrice);

    // Create booking (master record)
    const booking = new Booking({
      customerID: customerId,
      totalPrice: depositAmount, // Initially only deposit
      depositAmount: depositAmount,
      status: 'Pending',
      statusPayment: 'Unpaid'
    });

    await booking.save({ session });

    // Add bookingID to all details
    bookingDetailsToCreate.forEach(detail => {
      detail.bookingID = booking._id;
    });

    // Create booking details
    const createdDetails = await BookingDetail.insertMany(bookingDetailsToCreate, { session });

    // Commit transaction
    await session.commitTransaction();

    // Send confirmation email (không throw error nếu email fail)
    try {
      const Customer = require('../../models/Customer');
      const customer = await Customer.findById(customerId);
      if (customer) {
        await sendBookingConfirmationEmail(customer, booking, createdDetails, field);
      }
    } catch (emailError) {
      console.error('Error sending booking confirmation email:', emailError);
    }

    return {
      bookingId: booking._id,
      totalPrice: totalPrice,
      depositAmount: depositAmount,
      status: booking.status,
      qrCode: field.managerID?.imageQR || null, // QR code của manager để khách chuyển tiền
      managerInfo: field.managerID ? {
        name: field.managerID.name,
        phone: field.managerID.phone
      } : null,
      bookingDetails: createdDetails.map(bd => ({
        id: bd._id,
        fieldName: field.fieldName,
        startTime: bd.startTime,
        endTime: bd.endTime,
        price: bd.priceSnapshot,
        status: bd.status
      })),
      message: 'Đặt sân thành công! Vui lòng thanh toán tiền cọc để xác nhận.'
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Update booking detail status (by manager)
 */
const updateBookingDetailStatus = async (bookingDetailId, newStatus, managerId) => {
  // Validate status
  if (!['Active', 'Cancelled', 'Completed'].includes(newStatus)) {
    throw { statusCode: 400, message: 'Trạng thái không hợp lệ' };
  }

  const bookingDetail = await BookingDetail.findById(bookingDetailId)
    .populate('fieldID')
    .populate('bookingID');

  if (!bookingDetail) {
    throw { statusCode: 404, message: 'Booking detail không tồn tại' };
  }

  // Check if manager owns this field
  const field = bookingDetail.fieldID;
  if (field.managerID.toString() !== managerId.toString()) {
    throw { statusCode: 403, message: 'Bạn không có quyền cập nhật booking này' };
  }

  const oldStatus = bookingDetail.status;
  bookingDetail.status = newStatus;
  await bookingDetail.save();

  // Recalculate booking totals
  await recalculateBookingTotals(bookingDetail.bookingID._id);

  // Send email notification to customer
  try {
    const Customer = require('../../models/Customer');
    const customer = await Customer.findById(bookingDetail.bookingID.customerID);
    if (customer) {
      await sendStatusChangeEmail(customer, bookingDetail, oldStatus, newStatus, field);
    }
  } catch (emailError) {
    console.error('Error sending status change email:', emailError);
  }

  return {
    message: 'Cập nhật trạng thái thành công',
    bookingDetail: {
      id: bookingDetail._id,
      status: bookingDetail.status,
      startTime: bookingDetail.startTime,
      endTime: bookingDetail.endTime
    }
  };
};

/**
 * Recalculate booking totals based on booking detail statuses
 * Logic:
 * - Nếu Booking.status = Cancelled → totalPrice = 0, depositAmount = 0
 * - Nếu Booking.status ≠ Cancelled:
 *   + depositAmount (booking) = 20% × Σ(priceSnapshot của slots Active/Cancelled)
 *   + totalPrice = depositAmount + Σ(priceSnapshot của slots Completed)
 */
const recalculateBookingTotals = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  const bookingDetails = await BookingDetail.find({ bookingID: bookingId });

  // Trường hợp 1: Booking bị Cancelled → Set về 0
  if (booking.status === 'Cancelled') {
    booking.totalPrice = 0;
    booking.depositAmount = 0;
    await booking.save();
    return booking;
  }

  // Trường hợp 2: Booking không Cancelled
  let completedPrice = 0; // Tổng giá của slots Completed
  let activeAndCancelledPrice = 0; // Tổng giá của slots Active/Cancelled

  for (const detail of bookingDetails) {
    if (detail.status === 'Completed') {
      completedPrice += detail.priceSnapshot;
    } else if (detail.status === 'Active' || detail.status === 'Cancelled') {
      activeAndCancelledPrice += detail.priceSnapshot;
    }
  }

  // Tính depositAmount từ Active/Cancelled slots
  const depositAmount = calculateDepositAmount(activeAndCancelledPrice); // 20%

  // Tính totalPrice = deposit + completed
  const totalPrice = depositAmount + completedPrice;

  // Update booking
  booking.totalPrice = totalPrice;
  booking.depositAmount = depositAmount;
  await booking.save();

  return booking;
};

/**
 * Auto-complete bookings (called by cron job)
 */
const autoCompleteBookings = async () => {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // Find booking details that should be auto-completed
  const bookingDetails = await BookingDetail.find({
    status: 'Active',
    endTime: { $lte: tenMinutesAgo }
  }).populate('bookingID').populate('fieldID');

  let completedCount = 0;

  for (const detail of bookingDetails) {
    const oldStatus = detail.status;
    detail.status = 'Completed';
    await detail.save();

    // Recalculate booking totals
    await recalculateBookingTotals(detail.bookingID._id);

    completedCount++;

    // Send email notification
    try {
      const Customer = require('../../models/Customer');
      const customer = await Customer.findById(detail.bookingID.customerID);
      if (customer) {
        await sendStatusChangeEmail(customer, detail, oldStatus, 'Completed', detail.fieldID);
      }
    } catch (emailError) {
      console.error('Error sending auto-complete email:', emailError);
    }
  }

  return {
    completedCount,
    message: `Đã tự động hoàn thành ${completedCount} booking details`
  };
};

/**
 * Get customer bookings
 */
const getCustomerBookings = async (customerId) => {
  const bookings = await Booking.find({ customerID: customerId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'customerID',
      select: 'name email phone'
    });

  const bookingsWithDetails = await Promise.all(
    bookings.map(async (booking) => {
      const details = await BookingDetail.find({ bookingID: booking._id })
        .populate({
          path: 'fieldID',
          populate: {
            path: 'managerID',
            select: 'name phone imageQR'
          }
        })
        .sort({ startTime: 1 });

      // Lấy manager info từ detail đầu tiên (tất cả details đều cùng manager)
      const manager = details[0]?.fieldID?.managerID;

      // Tính toán các thông tin thanh toán
      const completedPrice = details
        .filter(bd => bd.status === 'Completed')
        .reduce((sum, bd) => sum + bd.priceSnapshot, 0);
      
      const activePrice = details
        .filter(bd => bd.status === 'Active')
        .reduce((sum, bd) => sum + bd.priceSnapshot, 0);
      
      // Số tiền còn phải trả
      let remainingAmount = 0;
      if (booking.status === 'Pending') {
        // Chưa trả gì - cần trả cọc
        remainingAmount = booking.depositAmount;
      } else if (booking.status === 'Confirmed') {
        if (booking.statusPayment === 'Unpaid') {
          // Đã trả cọc (depositAmount) - còn phải trả phần còn lại
          remainingAmount = Math.max(0, booking.totalPrice - booking.depositAmount);
        }
        // Nếu Paid thì remainingAmount = 0
      }

      // Tóm tắt trạng thái
      let paymentMessage = '';
      if (booking.status === 'Pending') {
        paymentMessage = `Cần thanh toán tiền cọc: ${booking.depositAmount.toLocaleString('vi-VN')}đ`;
      } else if (booking.status === 'Confirmed') {
        if (booking.statusPayment === 'Paid') {
          paymentMessage = 'Đã thanh toán đủ';
        } else if (remainingAmount > 0) {
          paymentMessage = `Cần thanh toán thêm: ${remainingAmount.toLocaleString('vi-VN')}đ`;
        } else {
          paymentMessage = 'Đã trả cọc, chờ sử dụng';
        }
      } else if (booking.status === 'Cancelled') {
        paymentMessage = 'Booking đã bị hủy';
      }

      return {
        id: booking._id,
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
          paymentMessage: paymentMessage
        },
        
        // Flags hữu ích
        canCancel: booking.status === 'Pending',
        needPayment: remainingAmount > 0,
        
        // Chỉ hiển thị QR code khi booking đang Pending
        qrCode: booking.status === 'Pending' && manager?.imageQR ? manager.imageQR : null,
        managerInfo: booking.status === 'Pending' && manager ? {
          name: manager.name,
          phone: manager.phone
        } : null,
        
        bookingDetails: details.map(bd => ({
          id: bd._id,
          fieldName: bd.fieldID?.fieldName || '',
          fieldAddress: bd.fieldID?.address || '',
          startTime: bd.startTime,
          endTime: bd.endTime,
          price: bd.priceSnapshot,
          status: bd.status
        }))
      };
    })
  );

  return bookingsWithDetails;
};

/**
 * Send booking confirmation email
 */
const sendBookingConfirmationEmail = async (customer, booking, bookingDetails, field) => {
  const nodemailer = require('nodemailer');

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.warn('⚠️ Email not configured. Skipping booking confirmation email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const detailsHtml = bookingDetails.map(bd => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDateTime(bd.startTime)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDateTime(bd.endTime)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${bd.priceSnapshot.toLocaleString('vi-VN')}đ</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"San Sieu Toc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: 'Xác nhận đặt sân - San Sieu Toc',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #4CAF50;">✅ Đặt sân thành công!</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Cảm ơn bạn đã đặt sân tại <strong>${field.fieldName}</strong>.</p>
        
        <h3>Thông tin booking:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Bắt đầu</th>
              <th style="padding: 10px; text-align: left;">Kết thúc</th>
              <th style="padding: 10px; text-align: left;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${detailsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
          <p style="margin: 5px 0;"><strong>Tiền cọc:</strong> ${booking.depositAmount.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Trạng thái:</strong> Chờ thanh toán</p>
        </div>
        
        <p style="margin-top: 20px;">Vui lòng thanh toán tiền cọc để xác nhận đặt sân.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">© 2026 San Sieu Toc. All rights reserved.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send status change email
 */
const sendStatusChangeEmail = async (customer, bookingDetail, oldStatus, newStatus, field) => {
  const nodemailer = require('nodemailer');

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.warn('⚠️ Email not configured. Skipping status change email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const statusColors = {
    'Active': '#4CAF50',
    'Completed': '#2196F3',
    'Cancelled': '#f44336'
  };

  const statusLabels = {
    'Active': 'Đang hoạt động',
    'Completed': 'Đã hoàn thành',
    'Cancelled': 'Đã hủy'
  };

  const mailOptions = {
    from: `"San Sieu Toc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: 'Cập nhật trạng thái đặt sân - San Sieu Toc',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: ${statusColors[newStatus]};">Cập nhật trạng thái booking</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Trạng thái booking của bạn đã được cập nhật.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid ${statusColors[newStatus]};">
          <p style="margin: 5px 0;"><strong>Sân:</strong> ${field.fieldName}</p>
          <p style="margin: 5px 0;"><strong>Thời gian:</strong> ${formatDateTime(bookingDetail.startTime)} - ${formatDateTime(bookingDetail.endTime)}</p>
          <p style="margin: 5px 0;"><strong>Giá:</strong> ${bookingDetail.priceSnapshot.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Trạng thái cũ:</strong> ${statusLabels[oldStatus]}</p>
          <p style="margin: 5px 0;"><strong>Trạng thái mới:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: bold;">${statusLabels[newStatus]}</span></p>
        </div>
        
        ${newStatus === 'Completed' ? '<p>✅ Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>' : ''}
        ${newStatus === 'Cancelled' ? '<p>❌ Booking của bạn đã bị hủy. Vui lòng liên hệ nếu có thắc mắc.</p>' : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">© 2026 San Sieu Toc. All rights reserved.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Cancel booking by customer (only when status is Pending)
 */
const cancelBooking = async (customerId, bookingId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw { statusCode: 404, message: 'Booking không tồn tại' };
  }

  // Check if booking belongs to customer
  if (booking.customerID.toString() !== customerId.toString()) {
    throw { statusCode: 403, message: 'Bạn không có quyền hủy booking này' };
  }

  // Only allow cancellation when status is Pending
  if (booking.status !== 'Pending') {
    throw { 
      statusCode: 400, 
      message: 'Chỉ có thể hủy booking khi trạng thái là Pending (Chờ thanh toán)' 
    };
  }

  // Update booking status
  const oldStatus = booking.status;
  booking.status = 'Cancelled';
  
  // Khi chuyển sang Cancelled, set totalPrice và depositAmount về 0
  booking.totalPrice = 0;
  booking.depositAmount = 0;
  
  await booking.save();

  // Update all booking details to Cancelled
  const bookingDetails = await BookingDetail.find({ bookingID: bookingId });
  for (const detail of bookingDetails) {
    const oldDetailStatus = detail.status;
    detail.status = 'Cancelled';
    await detail.save();

    // Send email for each detail status change
    try {
      const Customer = require('../../models/Customer');
      const customer = await Customer.findById(customerId);
      const field = await Field.findById(detail.fieldID);
      if (customer && field) {
        await sendStatusChangeEmail(customer, detail, oldDetailStatus, 'Cancelled', field);
      }
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
    }
  }

  // Không cần recalculate vì đã set về 0 rồi

  return {
    message: 'Hủy booking thành công',
    booking: {
      id: booking._id,
      status: booking.status
    }
  };
};

module.exports = {
  getFieldAvailability,
  createBooking,
  updateBookingDetailStatus,
  cancelBooking,
  autoCompleteBookings,
  getCustomerBookings,
  recalculateBookingTotals
};
