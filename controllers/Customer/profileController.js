const profileService = require('../../services/Customer/profileService');

/**
 * Controller: Get Customer Profile
 * Nhiệm vụ: Nhận request → Gọi Service → Trả response
 */
const getProfile = async (req, res) => {
  try {
    const result = await profileService.getCustomerProfile(req.userId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get Customer Profile Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi lấy thông tin';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

/**
 * Controller: Update Customer Profile
 * Nhiệm vụ: Nhận request → Gọi Service → Trả response
 */
const updateProfile = async (req, res) => {
  try {
    const result = await profileService.updateCustomerProfile(req.userId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: result
    });
  } catch (error) {
    console.error('Update Customer Profile Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Lỗi server khi cập nhật thông tin';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
