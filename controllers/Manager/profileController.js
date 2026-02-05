const profileService = require('../../services/Manager/profileService');

/**
 * Controller: Get Manager Profile
 * Task: Receive request → Call Service → Return response
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
    const message = error.message || 'Server error while fetching profile';
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: error.message 
    });
  }
};

/**
 * Controller: Update Manager Profile
 * Task: Receive request → Call Service → Return response
 */
const updateProfile = async (req, res) => {
  try {
    const result = await profileService.updateManagerProfile(req.userId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update Manager Profile Error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error while updating profile';
    
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
