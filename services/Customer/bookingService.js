const Field = require('../../models/Field');
const Booking = require('../../models/Booking');
const BookingDetail = require('../../models/BookingDetail');
const SlotHold = require('../../models/SlotHold');
const {
  generateTimeSlots,
  generateDateTimeSlots,
  generateBookingDates,
  isPastDate,
  isPastDateTime,
  calculateSlotPrice,
  calculateDepositAmount,
  assertBookingDatesWithinAllowedYears,
  formatDate,
  formatDateTime
} = require('../../utils/bookingHelpers');
const { sendResetPasswordEmail, sendNewBookingNotificationToManager } = require('../../utils/emailConfig');

/**
 * Get field availability for a specific date
 */
const getFieldAvailability = async (fieldId, date) => {
  // Validate field
  const field = await Field.findById(fieldId).populate('fieldTypeID');
  if (!field) {
    throw { statusCode: 404, message: 'Sân không tồn tại' };
  }

  if (field.status === 'Maintenance') {
    throw { statusCode: 400, message: 'Sân đang bảo trì' };
  }

  // Check if date is in the past
  if (isPastDate(date)) {
    throw { statusCode: 400, message: 'Không thể xem lịch của ngày đã qua' };
  }

  // Limit booking window by year (also applies to availability view)
  assertBookingDatesWithinAllowedYears([date]);

  // Generate time slots based on field settings
  const timeSlots = generateTimeSlots(
    field.openingTime,
    field.closingTime,
    field.slotDuration,
    10 // break time between slots
  );

  // Generate full datetime slots for the date
  const dateTimeSlots = generateDateTimeSlots(date, timeSlots);

  // Get booked slots for this date (local time boundaries)
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59.999`);

  // Consider both Pending and Active details as blocking (slot is locked immediately after customer creates booking)
  const bookedDetails = await BookingDetail.find({
    fieldID: fieldId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['Pending', 'Active'] }
  }).populate({
    path: 'bookingID',
    match: { status: { $in: ['Pending', 'Confirmed'] } }
  });

  const heldDetails = await SlotHold.find({
    fieldID: fieldId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
    status: 'Held'
  }).select('startTime endTime');

  // Filter out bookingDetails where booking is not Pending/Confirmed (e.g., Cancelled)
  const blockingBookedDetails = bookedDetails.filter(bd => bd.bookingID !== null);

  // Mark slots as available or not
  const slots = dateTimeSlots.map(slot => {
    const isBooked = blockingBookedDetails.some(bd =>
      bd.startTime.getTime() === slot.startTime.getTime() &&
      bd.endTime.getTime() === slot.endTime.getTime()
    );

    const isHeld = heldDetails.some(h =>
      h.startTime.getTime() === slot.startTime.getTime() &&
      h.endTime.getTime() === slot.endTime.getTime()
    );

    const price = calculateSlotPrice(slot.startTime, slot.endTime, field.hourlyPrice);

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: field.slotDuration,
      isAvailable: !(isBooked || isHeld),
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
    duration, // months (only for recurring)
    renewFromBookingId // optional: convert SlotHold of this series booking
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

  // Limit booking window by year (covers weekly/recurring ranges too)
  assertBookingDatesWithinAllowedYears(bookingDates);

  let booking = null;

  try {
    const bookingDetailsToCreate = [];
    let totalPrice = 0;

    // For each date
    for (const date of bookingDates) {
      const dateStr = formatDate(date);

      // For each selected slot
      for (const slot of selectedSlots) {
        // Build local datetimes matching generateDateTimeSlots() format (no Z = local time)
        const slotStartTime = new Date(`${dateStr}T${slot.startTime}:00`);
        const slotEndTime = new Date(`${dateStr}T${slot.endTime}:00`);

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

        // Check if slot is already locked by another booking (Pending or Confirmed)
        const existingBooking = await BookingDetail.findOne({
          fieldID: fieldId,
          startTime: slotStartTime,
          endTime: slotEndTime,
          status: { $in: ['Pending', 'Active'] }
        }).populate({
          path: 'bookingID',
          match: { status: { $in: ['Pending', 'Confirmed'] } },
          select: '_id status'
        });

        if (existingBooking && existingBooking.bookingID) {
          throw {
            statusCode: 409,
            message: `Slot ${slot.startTime}-${slot.endTime} ngày ${dateStr} đã được đặt. Vui lòng chọn slot khác!`
          };
        }

        // Check if slot is held (reserved for renewal priority)
        const existingHold = await SlotHold.findOne({
          fieldID: fieldId,
          startTime: slotStartTime,
          endTime: slotEndTime,
          status: 'Held'
        }).select('seriesBookingId');

        if (existingHold) {
          const allowConvert = renewFromBookingId && String(existingHold.seriesBookingId) === String(renewFromBookingId);
          if (!allowConvert) {
            throw {
              statusCode: 409,
              message: `Slot ${slot.startTime}-${slot.endTime} ngày ${dateStr} đang được giữ chỗ. Vui lòng chọn slot khác!`
            };
          }
        }

        // Calculate price for this slot
        const slotPrice = calculateSlotPrice(slotStartTime, slotEndTime, field.hourlyPrice);
        totalPrice += slotPrice;

        bookingDetailsToCreate.push({
          fieldID: fieldId,
          startTime: slotStartTime,
          endTime: slotEndTime,
          priceSnapshot: slotPrice,
          status: 'Pending'
        });
      }
    }

    // Calculate deposit (30% of total)
    const depositAmount = calculateDepositAmount(totalPrice);

    // Create booking (master record)
    booking = new Booking({
      fieldID: fieldId,
      customerID: customerId,
      repeatType: repeatType,
      durationMonths: repeatType === 'recurring' ? (duration || 0) : 0,
      renewedFromBookingId: renewFromBookingId || null,
      totalPrice: depositAmount, // Initially only deposit
      depositAmount: depositAmount,
      status: 'Pending',
      statusPayment: 'Unpaid'
    });

    await booking.save();

    // Add bookingID to all details
    bookingDetailsToCreate.forEach(detail => {
      detail.bookingID = booking._id;
    });

    // Create booking details
    const createdDetails = await BookingDetail.insertMany(bookingDetailsToCreate);

    // If this is a recurring contract, compute contract metadata.
    // NOTE: Slot locking (SlotHold creation/conversion) is done only after manager confirms deposit.
    if (repeatType === 'recurring') {
      try {
        const contractStartAt = createdDetails.reduce(
          (min, bd) => (bd.startTime < min ? bd.startTime : min),
          createdDetails[0].startTime
        );
        const contractEndAt = createdDetails.reduce(
          (max, bd) => (bd.endTime > max ? bd.endTime : max),
          createdDetails[0].endTime
        );

        const holdUntil = new Date(contractStartAt);
        holdUntil.setFullYear(holdUntil.getFullYear() + 1);

        booking.contractStartAt = contractStartAt;
        booking.contractEndAt = contractEndAt;
        booking.holdUntil = holdUntil;
        booking.renewalState = booking.renewalState || 'Active';
        await booking.save();
      } catch (metaError) {
        console.error('Error creating SlotHold for recurring contract:', metaError.message || metaError);
      }
    }

    // Send emails (không throw error nếu email fail)
    try {
      const Customer = require('../../models/Customer');
      const customer = await Customer.findById(customerId);

      if (customer) {
        // Customer confirmation email (existing behavior)
        await sendBookingConfirmationEmail(customer, booking, createdDetails, field);

        // Manager notification email (new)
        await sendNewBookingNotificationToManager(field.managerID, customer, booking, createdDetails, field);
      }
    } catch (emailError) {
      console.error('Error sending booking emails:', emailError.message || emailError);
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
    // Manual cleanup: remove booking and its details if booking was already saved
    if (booking && booking._id) {
      await Booking.deleteOne({ _id: booking._id }).catch(() => {});
      await BookingDetail.deleteMany({ bookingID: booking._id }).catch(() => {});
    }
    throw error;
  }
};

/**
 * Auto-expire Pending bookings after a timeout so slots are freed.
 * Default: 24 hours.
 */
const expirePendingBookings = async (timeoutHours = 24) => {
  const hours = Number(timeoutHours);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw { statusCode: 400, message: 'timeoutHours không hợp lệ' };
  }

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const pending = await Booking.find({
    status: 'Pending',
    createdAt: { $lte: cutoff }
  }).select('_id');

  if (pending.length === 0) {
    return { expiredBookings: 0, expiredDetails: 0 };
  }

  const bookingIds = pending.map((b) => b._id);

  const bookingRes = await Booking.updateMany(
    { _id: { $in: bookingIds }, status: 'Pending' },
    { $set: { status: 'Cancelled', totalPrice: 0, depositAmount: 0 } }
  );

  const detailsRes = await BookingDetail.updateMany(
    { bookingID: { $in: bookingIds }, status: { $in: ['Pending', 'Active'] } },
    { $set: { status: 'Cancelled' } }
  );

  return {
    expiredBookings: bookingRes.modifiedCount || 0,
    expiredDetails: detailsRes.modifiedCount || 0
  };
};

/**
 * Update booking detail status (by manager)
 */
const updateBookingDetailStatus = async (bookingDetailId, newStatus, managerId) => {
  // Validate status
  if (!['Cancelled', 'Completed'].includes(newStatus)) {
    throw { statusCode: 400, message: 'Trạng thái không hợp lệ. Chỉ chấp nhận Cancelled hoặc Completed' };
  }

  const bookingDetail = await BookingDetail.findById(bookingDetailId)
    .populate({
      path: 'fieldID',
      populate: {
        path: 'managerID',
        select: 'name email phone'
      }
    })
    .populate('bookingID');

  if (!bookingDetail) {
    throw { statusCode: 404, message: 'Booking detail không tồn tại' };
  }

  // Check if manager owns this field
  const field = bookingDetail.fieldID;
  const fieldManagerId = field?.managerID?._id || field?.managerID;
  if (String(fieldManagerId) !== String(managerId)) {
    throw { statusCode: 403, message: 'Bạn không có quyền cập nhật booking này' };
  }

  // Booking phải ở trạng thái Confirmed mới được cập nhật detail
  if (bookingDetail.bookingID.status !== 'Confirmed') {
    throw { statusCode: 400, message: 'Chỉ có thể cập nhật slot khi booking đã được xác nhận (Confirmed)' };
  }

  // Detail phải đang Active mới được chuyển sang Cancelled hoặc Completed
  if (bookingDetail.status !== 'Active') {
    throw { statusCode: 400, message: 'Chỉ có thể cập nhật slot đang ở trạng thái Active' };
  }

  if (!['Cancelled', 'Completed'].includes(newStatus)) {
    throw { statusCode: 400, message: 'Chỉ được chuyển trạng thái slot sang Cancelled hoặc Completed' };
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
      await sendStatusChangeEmail(
        customer,
        bookingDetail,
        oldStatus,
        newStatus,
        field,
        newStatus === 'Cancelled' ? { cancelReason: 'no_show' } : undefined
      );
    } else {
      console.warn('⚠️ Customer not found for email notification, bookingDetailId:', bookingDetailId);
    }
  } catch (emailError) {
    console.error('❌ Error sending status change email:', emailError.message || emailError);
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
 *   + depositAmount (booking) = 30% × Σ(priceSnapshot của slots Pending/Active/Cancelled)
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
  let pendingActiveCancelledPrice = 0; // Tổng giá của slots Pending/Active/Cancelled

  for (const detail of bookingDetails) {
    if (detail.status === 'Completed') {
      completedPrice += detail.priceSnapshot;
    } else if (detail.status === 'Pending' || detail.status === 'Active' || detail.status === 'Cancelled') {
      pendingActiveCancelledPrice += detail.priceSnapshot;
    }
  }

  // Tính depositAmount từ Active/Cancelled slots
  const depositAmount = calculateDepositAmount(pendingActiveCancelledPrice); // 30%

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
      console.error('❌ Error sending auto-complete email:', emailError.message || emailError);
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

        // Recurring contract metadata (for renewal UI)
        repeatType: booking.repeatType || 'once',
        durationMonths: booking.durationMonths || 0,
        contractStartAt: booking.contractStartAt || null,
        contractEndAt: booking.contractEndAt || null,
        holdUntil: booking.holdUntil || null,
        renewalState: booking.renewalState || null,
        renewalReminderSentAt: booking.renewalReminderSentAt || null,
        renewedFromBookingId: booking.renewedFromBookingId || null,
        depositConfirmedAt: booking.depositConfirmedAt || null,
        
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
          fieldId: bd.fieldID?._id || null,
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

  const bookingCode = booking?._id ? `#${booking._id.toString().slice(-6)}` : '';
  const createdAtText = booking?.createdAt ? formatDateTime(booking.createdAt) : '';
  const managerName = field?.managerID?.name || '';
  const managerPhone = field?.managerID?.phone || '';
  const fieldAddress = field?.address || '';

  const mailOptions = {
    from: `"Sân Siêu Tốc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `Đặt sân thành công – vui lòng thanh toán tiền cọc (${bookingCode})`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #16a34a;">Đặt sân thành công</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Bạn đã tạo booking <strong>${bookingCode}</strong> tại <strong>${field.fieldName}</strong>${fieldAddress ? ` — ${fieldAddress}` : ''}.</p>

        ${createdAtText ? `<p style="margin: 6px 0 0;"><strong>Thời điểm tạo:</strong> ${createdAtText}</p>` : ''}
        
        <h3 style="margin-top: 18px;">Các slot đã đặt</h3>
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
          <p style="margin: 5px 0;"><strong>Tiền cọc cần thanh toán:</strong> ${booking.depositAmount.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Trạng thái:</strong> Chờ xác nhận cọc</p>
        </div>
        
        <p style="margin-top: 16px;">Bước tiếp theo: vui lòng thanh toán tiền cọc theo hướng dẫn trong ứng dụng. Sau khi quản lý sân xác nhận, booking sẽ chuyển sang trạng thái <strong>Đã xác nhận</strong>.</p>

        ${(managerName || managerPhone) ? `
          <div style="margin-top: 14px; padding: 12px; background-color: #f8fafc; border-left: 4px solid #94a3b8;">
            <p style="margin: 4px 0;"><strong>Liên hệ quản lý sân</strong></p>
            ${managerName ? `<p style="margin: 4px 0;">Tên: ${managerName}</p>` : ''}
            ${managerPhone ? `<p style="margin: 4px 0;">SĐT: ${managerPhone}</p>` : ''}
          </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">© 2026 Sân Siêu Tốc. All rights reserved.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send status change email
 */
const sendStatusChangeEmail = async (customer, bookingDetail, oldStatus, newStatus, field, options = {}) => {
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

  const manager = field?.managerID && typeof field.managerID === 'object'
    ? field.managerID
    : null;

  const managerEmail = manager?.email ? String(manager.email).trim() : '';
  const managerPhone = manager?.phone ? String(manager.phone).trim() : '';

  const managerContactForSentence = managerEmail && managerPhone
    ? `'${managerEmail}' hoặc '${managerPhone}'`
    : managerEmail
      ? `'${managerEmail}'`
      : managerPhone
        ? `'${managerPhone}'`
        : '';

  const cancelReason = options?.cancelReason; // 'no_show' | 'customer_cancelled' | undefined
  const cancelledReasonText =
    cancelReason === 'no_show'
      ? 'Slot bị hủy do bạn không đến sân.'
      : cancelReason === 'customer_cancelled'
        ? 'Slot đã được hủy theo yêu cầu của bạn.'
        : 'Slot đã bị hủy.';

  const mailOptions = {
    from: `"Sân Siêu Tốc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject:
      newStatus === 'Cancelled' && cancelReason === 'no_show'
        ? 'Thông báo: Slot bị hủy do không đến sân'
        : `Cập nhật trạng thái slot đặt sân - ${statusLabels[newStatus] || newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: ${statusColors[newStatus]};">Cập nhật trạng thái slot đặt sân</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Một slot trong booking của bạn đã được cập nhật.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid ${statusColors[newStatus]};">
          <p style="margin: 5px 0;"><strong>Sân:</strong> ${field.fieldName}</p>
          ${field.address ? `<p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${field.address}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Thời gian:</strong> ${formatDateTime(bookingDetail.startTime)} - ${formatDateTime(bookingDetail.endTime)}</p>
          <p style="margin: 5px 0;"><strong>Giá:</strong> ${bookingDetail.priceSnapshot.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Trạng thái cũ:</strong> ${statusLabels[oldStatus]}</p>
          <p style="margin: 5px 0;"><strong>Trạng thái mới:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: bold;">${statusLabels[newStatus]}</span></p>
        </div>
        
        ${newStatus === 'Completed' ? '<p>✅ Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>' : ''}
        ${newStatus === 'Cancelled' ? `<p style="margin-top: 10px;"><strong>Lý do:</strong> ${cancelledReasonText}</p><p>Vui lòng liên hệ ${managerContactForSentence || 'quản lý sân'} nếu có thắc mắc.</p>` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">© 2026 Sân Siêu Tốc. All rights reserved.</p>
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
      const field = await Field.findById(detail.fieldID).populate({
        path: 'managerID',
        select: 'name email phone'
      });
      if (customer && field) {
        await sendStatusChangeEmail(customer, detail, oldDetailStatus, 'Cancelled', field, { cancelReason: 'customer_cancelled' });
      }
    } catch (emailError) {
      console.error('❌ Error sending cancellation email:', emailError.message || emailError);
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

/**
 * Renew a recurring 3-month contract booking.
 * - Creates a new recurring booking starting from next cycle.
 * - Links via renewedFromBookingId.
 * - Converts SlotHold entries (Held) into Converted for the new paid period.
 * Note: Renewal is considered successful only after manager confirms deposit.
 */
const renewRecurringContract = async (customerId, bookingId, duration = 3) => {
  const durationMonths = duration == null ? 3 : Number(duration);
  if (![1, 2, 3].includes(durationMonths)) {
    throw { statusCode: 400, message: 'Thời gian gia hạn phải là 1, 2 hoặc 3 tháng' };
  }

  const original = await Booking.findOne({ _id: bookingId, customerID: customerId }).populate('fieldID');
  if (!original) {
    throw { statusCode: 404, message: 'Booking gốc không tồn tại' };
  }

  if (original.repeatType !== 'recurring' || original.durationMonths !== 3) {
    throw { statusCode: 400, message: 'Chỉ hỗ trợ gia hạn cho hợp đồng đặt hàng tuần (3 tháng)' };
  }

  if (!original.fieldID) {
    throw { statusCode: 400, message: 'Booking gốc thiếu thông tin sân (fieldID). Không thể gia hạn.' };
  }

  if (!original.contractEndAt || !original.contractStartAt) {
    throw { statusCode: 400, message: 'Booking gốc chưa có thông tin thời hạn hợp đồng. Không thể gia hạn.' };
  }

  if (original.status !== 'Confirmed') {
    throw { statusCode: 400, message: 'Chỉ có thể gia hạn khi booking gốc đã được xác nhận (Confirmed)' };
  }

  const existingRenewal = await Booking.findOne({
    renewedFromBookingId: original._id,
    status: { $ne: 'Cancelled' }
  }).select('_id status');
  if (existingRenewal) {
    throw { statusCode: 409, message: 'Booking này đã được tạo gia hạn trước đó' };
  }

  const details = await BookingDetail.find({ bookingID: original._id }).sort({ startTime: 1 });
  if (!details || details.length === 0) {
    throw { statusCode: 400, message: 'Booking gốc không có chi tiết slot' };
  }

  const firstDateStr = formatDate(original.contractStartAt);
  const toTime = (d) => {
    const dt = new Date(d);
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const firstDayDetails = details.filter((bd) => formatDate(bd.startTime) === firstDateStr);
  const unique = new Map();
  for (const bd of firstDayDetails) {
    const s = toTime(bd.startTime);
    const e = toTime(bd.endTime);
    unique.set(`${s}-${e}`, { startTime: s, endTime: e });
  }
  const selectedSlots = Array.from(unique.values());
  if (selectedSlots.length === 0) {
    throw { statusCode: 400, message: 'Không xác định được khung giờ để gia hạn' };
  }

  const nextStart = new Date(original.contractEndAt);
  nextStart.setHours(0, 0, 0, 0);
  nextStart.setDate(nextStart.getDate() + 7);
  const startDate = formatDate(nextStart);

  const data = await createBooking(customerId, {
    fieldId: original.fieldID._id || original.fieldID,
    startDate,
    selectedSlots,
    repeatType: 'recurring',
    duration: durationMonths,
    renewFromBookingId: original._id
  });

  return {
    message: 'Tạo booking gia hạn thành công! Vui lòng thanh toán tiền cọc để xác nhận.',
    data
  };
};

const buildSlotSummaryForBooking = async (bookingId, contractStartAt) => {
  const details = await BookingDetail.find({ bookingID: bookingId }).sort({ startTime: 1 });
  if (!details || details.length === 0) return '';

  const firstDateStr = contractStartAt ? formatDate(contractStartAt) : formatDate(details[0].startTime);
  const toTime = (d) => {
    const dt = new Date(d);
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const firstDayDetails = details.filter((bd) => formatDate(bd.startTime) === firstDateStr);
  const unique = new Map();
  for (const bd of firstDayDetails) {
    const s = toTime(bd.startTime);
    const e = toTime(bd.endTime);
    unique.set(`${s}-${e}`, `${s}-${e}`);
  }
  return Array.from(unique.values()).join(', ');
};

/**
 * Cron task: Send reminder emails at T-14 days before contract ends.
 */
const sendRecurringContractExpiryReminders = async () => {
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + 14);

  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    repeatType: 'recurring',
    durationMonths: 3,
    status: 'Confirmed',
    contractEndAt: { $gte: start, $lte: end },
    renewalReminderSentAt: null
  })
    .populate({ path: 'customerID', select: 'name email' })
    .populate({ path: 'fieldID', populate: { path: 'managerID', select: 'name email' } });

  let sent = 0;
  for (const booking of bookings) {
    try {
      const customer = booking.customerID;
      const field = booking.fieldID;
      const manager = field?.managerID;

      if (!customer?.email || !field) continue;

      const slotSummary = await buildSlotSummaryForBooking(booking._id, booking.contractStartAt);
      const { sendRecurringContractExpiryReminderToCustomer, sendRecurringContractExpiryReminderToManager } = require('../../utils/emailConfig');

      await sendRecurringContractExpiryReminderToCustomer(customer, booking, field, slotSummary);
      if (manager?.email) {
        await sendRecurringContractExpiryReminderToManager(manager, booking, field, slotSummary);
      }

      booking.renewalReminderSentAt = new Date();
      booking.renewalState = 'ReminderSent';
      await booking.save();
      sent++;
    } catch (err) {
      console.error('Error sending contract expiry reminder:', err.message || err);
    }
  }

  return { sent, total: bookings.length };
};

/**
 * Cron task: Release held slots at T-7 days before contract ends,
 * if no renewal booking linked to this booking has confirmed deposit.
 */
const releaseHeldSlotsBeforeExpiry = async () => {
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + 7);

  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);

  const expiring = await Booking.find({
    repeatType: 'recurring',
    durationMonths: 3,
    status: 'Confirmed',
    contractEndAt: { $gte: start, $lte: end },
    renewalState: { $in: ['Active', 'ReminderSent'] }
  }).select('_id contractEndAt');

  let releasedBookings = 0;
  let releasedHolds = 0;

  for (const booking of expiring) {
    try {
      const renewedAndConfirmed = await Booking.exists({
        renewedFromBookingId: booking._id,
        depositConfirmedAt: { $ne: null }
      });

      if (renewedAndConfirmed) {
        await Booking.updateOne({ _id: booking._id }, { $set: { renewalState: 'Renewed' } });
        continue;
      }

      const res = await SlotHold.updateMany(
        {
          seriesBookingId: booking._id,
          status: 'Held',
          startTime: { $gte: booking.contractEndAt }
        },
        {
          $set: {
            status: 'Released',
            releasedAt: new Date()
          }
        }
      );

      releasedHolds += res.modifiedCount || 0;
      await Booking.updateOne({ _id: booking._id }, { $set: { renewalState: 'Released' } });
      releasedBookings++;
    } catch (err) {
      console.error('Error releasing held slots:', err.message || err);
    }
  }

  return { releasedBookings, releasedHolds, total: expiring.length };
};

module.exports = {
  getFieldAvailability,
  createBooking,
  updateBookingDetailStatus,
  cancelBooking,
  autoCompleteBookings,
  expirePendingBookings,
  getCustomerBookings,
  recalculateBookingTotals,
  renewRecurringContract,
  sendRecurringContractExpiryReminders,
  releaseHeldSlotsBeforeExpiry
};
