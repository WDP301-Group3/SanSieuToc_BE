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

module.exports = {
  sendResetPasswordEmail,
  sendDepositConfirmedEmail,
  sendPaymentConfirmedEmail,
  isEmailConfigured
};