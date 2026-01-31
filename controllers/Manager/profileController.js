const profileService = require('../../services/Manager/profileService');

/**
 * Controller: Get Manager Profile
 * Nhiệm vụ: Nhận request → Gọi Service → Trả response
 */
const getProfile = async (req, res) => {
  try {
    const result = await profileService.getManagerProfile(req.userId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get Manager Profile Error:', error);
    
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
 * Controller: Update Manager Profile
 * Nhiệm vụ: Nhận request → Gọi Service → Trả response
 */
const updateProfile = async (req, res) => {
  try {
    const result = await profileService.updateManagerProfile(req.userId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: result
    });
  } catch (error) {
    console.error('Update Manager Profile Error:', error);
    
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
