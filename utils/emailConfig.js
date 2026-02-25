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

module.exports = {
  sendResetPasswordEmail,
  isEmailConfigured
};