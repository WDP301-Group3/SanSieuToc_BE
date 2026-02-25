const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Manager = require('../../models/Manager');
const { isValidPassword, generateRandomPassword } = require('../../utils/validators');
const { sendResetPasswordEmail } = require('../../utils/emailConfig');

/**
 * Service: Login manager
 */
const loginManager = async (credentials) => {
  const { email, password } = credentials;

  // Validate input
  if (!email || !password) {
    throw { statusCode: 400, message: 'Email and password are required' };
  }

  // Find manager
  const manager = await Manager.findOne({ email });
  if (!manager) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, manager.password);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: manager._id, role: 'manager' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    manager: {
      id: manager._id,
      email: manager.email,
      name: manager.name,
      image: manager.image
    },
    token
  };
};

/**
 * Service: Change manager password
 */
const changeManagerPassword = async (managerId, passwordData) => {
  const { currentPassword, newPassword, confirmNewPassword } = passwordData;

  // Validate input
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw { statusCode: 400, message: 'Vui lòng điền đầy đủ thông tin' };
  }

  // Validate new password format
  if (!isValidPassword(newPassword)) {
    throw { 
      statusCode: 400, 
      message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&#)' 
    };
  }

  // Validate password match
  if (newPassword !== confirmNewPassword) {
    throw { statusCode: 400, message: 'Mật khẩu xác nhận không khớp' };
  }

  // Find manager
  const manager = await Manager.findById(managerId);
  if (!manager) {
    throw { statusCode: 404, message: 'Manager không tồn tại' };
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, manager.password);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Mật khẩu hiện tại không đúng' };
  }

  // Check if new password is same as current password
  const isSamePassword = await bcrypt.compare(newPassword, manager.password);
  if (isSamePassword) {
    throw { statusCode: 400, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' };
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  manager.password = hashedPassword;
  await manager.save();

  return {
    message: 'Đổi mật khẩu thành công'
  };
};

/**
 * Service: Reset manager password (forgot password)
 */
const resetManagerPassword = async (email) => {
  // Validate input
  if (!email) {
    throw { statusCode: 400, message: 'Email là bắt buộc' };
  }

  // Find manager by email
  const manager = await Manager.findOne({ email });
  if (!manager) {
    throw { statusCode: 404, message: 'Email không tồn tại trong hệ thống' };
  }

  // Generate new random password
  const newPassword = generateRandomPassword(12);

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password in database
  manager.password = hashedPassword;
  await manager.save();

  // Send email with new password
  try {
    await sendResetPasswordEmail(manager.email, newPassword, manager.name);
    return {
      message: 'Mật khẩu mới đã được gửi đến email của bạn',
      newPassword: process.env.NODE_ENV === 'development' ? newPassword : undefined
    };
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    // If email fails, still return success with the password (for development)
    return {
      message: 'Mật khẩu đã được đặt lại. Mật khẩu mới: ' + newPassword,
      newPassword: newPassword,
      emailSent: false
    };
  }
};

module.exports = {
  loginManager,
  changeManagerPassword,
  resetManagerPassword
};
