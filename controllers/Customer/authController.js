const authService = require('../../services/Customer/authService');

/**
 * Controller: Register Customer
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const register = async (req, res) => {
  try {
    const result = await authService.registerCustomer(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: result
    });
  } catch (error) {
    console.error('Register Customer Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi đăng ký';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

/**
 * Controller: Login Customer
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const login = async (req, res) => {
  try {
    const result = await authService.loginCustomer(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (error) {
    console.error('Login Customer Error:', error);
    
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
 * Controller: Change Customer Password
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const changePassword = async (req, res) => {
  try {
    const result = await authService.changeCustomerPassword(req.userId, req.body);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Change Customer Password Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while changing password';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

/**
 * Controller: Reset Customer Password
 * Nhiệm vụ: Nhận request từ client → Gọi Service → Trả response
 */
const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetCustomerPassword(req.body.email);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Reset Customer Password Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while resetting password';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  changePassword,
  resetPassword
};
