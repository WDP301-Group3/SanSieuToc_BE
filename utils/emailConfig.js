const nodemailer = require('nodemailer');

/**
 * Check if email is configured
 */
const isEmailConfigured = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  return (
    emailUser && 
    emailPassword && 
    emailUser !== 'your-email@gmail.com' && 
    emailPassword !== 'your-app-password' &&
    emailUser.includes('@')
  );
};

/**
 * Create email transporter
 * Note: You need to install nodemailer first: npm install nodemailer
 * Then add to .env file:
 * EMAIL_USER=your-email@gmail.com
 * EMAIL_PASSWORD=your-app-password (for Gmail, use App Password, not regular password)
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
      port: 465,
      secure: true,  // TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
  });
};

/**
 * Send email with new password
 * @param {string} to - Recipient email address
 * @param {string} newPassword - New generated password
 * @param {string} userName - User's name
 * @returns {Promise} - Email sending result
 */
const sendResetPasswordEmail = async (to, newPassword, userName) => {
  // Check if email is configured
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured. Skipping email sending.');
    console.warn('📧 New password for', userName + ':', newPassword);
    console.warn('ℹ️ To enable email, configure EMAIL_USER and EMAIL_PASSWORD in .env file');
    return { message: 'Email not configured - password generated but not sent' };
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"San Sieu Toc" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Đặt lại mật khẩu - Sân Siêu Tốc',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #333;">Xin chào ${userName},</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <p>Mật khẩu mới của bạn là:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <strong style="font-size: 18px; color: #333;">${newPassword}</strong>
        </div>
        <p style="color: #e74c3c; font-weight: bold;">⚠️ Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này để bảo mật tài khoản.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
        <p style="color: #777; font-size: 12px;">© 2026 San Sieu Toc. All rights reserved.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send email when deposit is confirmed (Pending → Confirmed)
 */
const sendDepositConfirmedEmail = async (customer, booking, field) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured. Skipping deposit confirmation email.');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"San Sieu Toc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: 'Xác nhận đã nhận tiền cọc - San Sieu Toc',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #4CAF50;">✅ Đã xác nhận tiền cọc!</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Chúng tôi đã xác nhận nhận được tiền cọc cho booking của bạn tại <strong>${field.fieldName}</strong>.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #4CAF50;">
          <p style="margin: 5px 0;"><strong>Mã booking:</strong> #${booking._id.toString().slice(-6)}</p>
          <p style="margin: 5px 0;"><strong>Tiền cọc:</strong> ${booking.depositAmount.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="color: #4CAF50; font-weight: bold;">Đã xác nhận</span></p>
        </div>
        
        <p>✅ Booking của bạn đã được xác nhận. Vui lòng đến đúng giờ đã đặt!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">© 2026 San Sieu Toc. All rights reserved.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send email when payment is confirmed (Unpaid → Paid)
 */
const sendPaymentConfirmedEmail = async (customer, booking, field) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured. Skipping payment confirmation email.');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"San Sieu Toc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: 'Xác nhận thanh toán hoàn tất - San Sieu Toc',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #2196F3;">✅ Thanh toán hoàn tất!</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Chúng tôi đã xác nhận nhận được thanh toán đầy đủ cho booking tại <strong>${field.fieldName}</strong>.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196F3;">
          <p style="margin: 5px 0;"><strong>Mã booking:</strong> #${booking._id.toString().slice(-6)}</p>
          <p style="margin: 5px 0;"><strong>Tổng tiền:</strong> ${booking.totalPrice.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="color: #2196F3; font-weight: bold;">Đã thanh toán đủ</span></p>
        </div>
        
        <p>🎉 Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">© 2026 San Sieu Toc. All rights reserved.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send email when a booking detail (slot) status changes
 * Called by manager when marking a slot as Completed or Cancelled
 */
const sendStatusChangeEmail = async (customer, bookingDetail, oldStatus, newStatus, field) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured. Skipping status change email.');
    return;
  }

  const transporter = createTransporter();

  const statusColors = { Active: '#4CAF50', Completed: '#2196F3', Cancelled: '#f44336' };
  const statusLabels = { Active: 'Đang hoạt động', Completed: 'Đã hoàn thành', Cancelled: 'Đã hủy' };

  const newColor = statusColors[newStatus] || '#666';
  const toLocale = (d) => new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const extraNote = newStatus === 'Completed'
    ? '<p>✅ Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>'
    : newStatus === 'Cancelled'
      ? '<p>❌ Slot này đã bị hủy do khách hàng không đến. Vui lòng liên hệ nếu có thắc mắc.</p>'
      : '';

  const mailOptions = {
    from: `"Sân Siêu Tốc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `Cập nhật trạng thái slot - ${statusLabels[newStatus] || newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: ${newColor};">Cập nhật trạng thái slot đặt sân</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Trạng thái một slot trong booking của bạn đã được cập nhật.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid ${newColor};">
          <p style="margin: 5px 0;"><strong>Sân:</strong> ${field.fieldName}</p>
          <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${field.address || ''}</p>
          <p style="margin: 5px 0;"><strong>Bắt đầu:</strong> ${toLocale(bookingDetail.startTime)}</p>
          <p style="margin: 5px 0;"><strong>Kết thúc:</strong> ${toLocale(bookingDetail.endTime)}</p>
          <p style="margin: 5px 0;"><strong>Giá slot:</strong> ${(bookingDetail.priceSnapshot || 0).toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Trạng thái cũ:</strong> ${statusLabels[oldStatus] || oldStatus}</p>
          <p style="margin: 5px 0;"><strong>Trạng thái mới:</strong>
            <span style="color: ${newColor}; font-weight: bold;">${statusLabels[newStatus] || newStatus}</span>
          </p>
        </div>
        ${extraNote}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">© 2026 Sân Siêu Tốc. All rights reserved.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Status-change email sent to ${customer.email} | messageId: ${info.messageId}`);
  return info;
};

/**
 * Send booking confirmation email (new booking created by customer)
 */
const sendBookingConfirmationEmail = async (customer, booking, bookingDetails, field) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured. Skipping booking confirmation email.');
    return;
  }

  const transporter = createTransporter();

  const detailsHtml = bookingDetails.map(bd => {
    const toLocale = (d) => new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${toLocale(bd.startTime)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;">${toLocale(bd.endTime)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;">${(bd.priceSnapshot||0).toLocaleString('vi-VN')}đ</td>
      </tr>`;
  }).join('');

  const mailOptions = {
    from: `"Sân Siêu Tốc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: 'Xác nhận đặt sân thành công - Sân Siêu Tốc',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #4CAF50;">✅ Đặt sân thành công!</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Cảm ơn bạn đã đặt sân tại <strong>${field.fieldName}</strong>.</p>
        <h3>Thông tin các slot đã đặt:</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:10px;text-align:left;">Bắt đầu</th>
              <th style="padding:10px;text-align:left;">Kết thúc</th>
              <th style="padding:10px;text-align:left;">Giá</th>
            </tr>
          </thead>
          <tbody>${detailsHtml}</tbody>
        </table>
        <div style="margin-top:20px;padding:15px;background:#fff3cd;border-left:4px solid #ffc107;">
          <p style="margin:5px 0;"><strong>Tiền cọc cần thanh toán:</strong> ${(booking.depositAmount||0).toLocaleString('vi-VN')}đ</p>
          <p style="margin:5px 0;"><strong>Trạng thái:</strong> Chờ xác nhận cọc</p>
        </div>
        <p style="margin-top:20px;">Vui lòng thanh toán tiền cọc để xác nhận đặt sân.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#777;font-size:12px;">© 2026 Sân Siêu Tốc. All rights reserved.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Booking confirmation email sent to ${customer.email} | messageId: ${info.messageId}`);
  return info;
};

/**
 * Send email when manager cancels a booking due to not receiving deposit
 * (Pending → Cancelled)
 */
const sendBookingCancelledDueToNoDepositEmail = async (
  customer,
  booking,
  bookingDetails,
  field,
) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured. Skipping booking cancellation (no deposit) email.');
    return;
  }

  const transporter = createTransporter();
  const toLocale = (d) => new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const detailsHtml = (bookingDetails || []).map((bd) => {
    const fieldName = bd.fieldID?.fieldName || field?.fieldName || '';
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${fieldName}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;">${toLocale(bd.startTime)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;">${toLocale(bd.endTime)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;">${(bd.priceSnapshot || 0).toLocaleString('vi-VN')}đ</td>
      </tr>`;
  }).join('');

  const bookingCode = booking?._id ? `#${booking._id.toString().slice(-6)}` : '';
  const depositAmount = booking?.depositAmount || 0;
  const totalPrice = booking?.totalPrice || 0;

  const mailOptions = {
    from: `"Sân Siêu Tốc" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: 'Thông báo hủy đặt sân do chưa thanh toán tiền cọc - Sân Siêu Tốc',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 700px;">
        <h2 style="color: #f44336;">❌ Booking đã bị hủy</h2>
        <p>Xin chào <strong>${customer.name}</strong>,</p>
        <p>Booking ${bookingCode} tại <strong>${field?.fieldName || ''}</strong> đã bị <strong>hủy</strong> do hệ thống/nhân viên chưa ghi nhận được tiền cọc trong thời gian yêu cầu.</p>

        <div style="margin: 20px 0; padding: 15px; background-color: #ffebee; border-left: 4px solid #f44336;">
          <p style="margin: 5px 0;"><strong>Mã booking:</strong> ${bookingCode}</p>
          <p style="margin: 5px 0;"><strong>Tổng tiền dự kiến:</strong> ${totalPrice.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Tiền cọc cần thanh toán:</strong> ${depositAmount.toLocaleString('vi-VN')}đ</p>
          <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="color:#f44336;font-weight:bold;">Đã hủy</span></p>
        </div>

        <h3 style="margin-top: 20px;">Các slot đã đặt</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:10px;text-align:left;">Sân</th>
              <th style="padding:10px;text-align:left;">Bắt đầu</th>
              <th style="padding:10px;text-align:left;">Kết thúc</th>
              <th style="padding:10px;text-align:left;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${detailsHtml || `<tr><td colspan="4" style="padding:10px;">(Không có dữ liệu slot)</td></tr>`}
          </tbody>
        </table>

        <p style="margin-top: 20px;">Nếu bạn đã chuyển tiền cọc nhưng chưa được ghi nhận, vui lòng liên hệ quản lý sân để được hỗ trợ đối soát.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#777;font-size:12px;">© 2026 Sân Siêu Tốc. All rights reserved.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Booking-cancel (no deposit) email sent to ${customer.email} | messageId: ${info.messageId}`);
  return info;
};

module.exports = {
  sendResetPasswordEmail,
  sendDepositConfirmedEmail,
  sendPaymentConfirmedEmail,
  sendStatusChangeEmail,
  sendBookingConfirmationEmail,
  sendBookingCancelledDueToNoDepositEmail,
  isEmailConfigured,
};