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

module.exports = {
  login
};
