const authService = require('../../services/Manager/authService');

/**
 * Controller: Login Manager
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const login = async (req, res) => {
  try {
    const result = await authService.loginManager(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (error) {
    console.error('Login Manager Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi đăng nhập';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

/**
 * Controller: Change Manager Password
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const changePassword = async (req, res) => {
  try {
    const result = await authService.changeManagerPassword(req.userId, req.body);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Change Manager Password Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi đổi mật khẩu';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

/**
 * Controller: Reset Manager Password
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetManagerPassword(req.body.email);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Reset Manager Password Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi đặt lại mật khẩu';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

module.exports = {
  login,
  changePassword,
  resetPassword
};
