const Manager = require('../../models/Manager');
const { isValidPhone } = require('../../utils/validators');
const { uploadImageBase64, deleteImage } = require('../../utils/cloudinaryConfig');

/**
 * Service: Get manager profile by ID
 */
const getManagerProfile = async (managerId) => {
  const manager = await Manager.findById(managerId).select('-password');
  
  if (!manager) {
    throw { statusCode: 404, message: 'Manager not found' };
  }

  return { manager };
};

/**
 * Service: Update manager profile
 */
const updateManagerProfile = async (managerId, updateData) => {
  const { name, phone, image, imageQR } = updateData;

  // Validate input
  if (!name || name.trim().length === 0) {
    throw { statusCode: 400, message: 'Tên không được để trống' };
  }

  // Validate phone format if provided
  if (phone) {
    if (!isValidPhone(phone)) {
      throw { 
        statusCode: 400, 
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng (VD: 0901234567)' 
      };
    }

    // Check if phone already exists (except current user)
    const existingPhone = await Manager.findOne({ 
      phone, 
      _id: { $ne: managerId } 
    });
    if (existingPhone) {
      throw { statusCode: 400, message: 'Số điện thoại đã được sử dụng' };
    }
  }

  // Update manager
  const updateFields = {
    name: name.trim()
  };
  
  if (phone !== undefined) updateFields.phone = phone;
  
  // Upload profile image to Cloudinary if base64 provided
  if (image !== undefined) {
    if (image && image.startsWith('data:image/')) {
      // Delete old image from Cloudinary (if exists)
      const oldManager = await Manager.findById(managerId);
      if (oldManager && oldManager.image) {
        await deleteImage(oldManager.image);
      }
      
      // Upload new image to Cloudinary
      const imageUrl = await uploadImageBase64(image, 'managers', `manager_${managerId}`);
      updateFields.image = imageUrl;
    } else {
      // If not base64 (can be URL or empty string)
      updateFields.image = image;
    }
  }
  
  // imageQR saves base64 directly to database
  if (imageQR !== undefined) {
    if (imageQR && !imageQR.startsWith('data:image/')) {
      throw { statusCode: 400, message: 'imageQR must be a valid base64 string (data:image/...)' };
    }
    updateFields.imageQR = imageQR;
  }

  const manager = await Manager.findByIdAndUpdate(
    managerId,
    updateFields,
    { new: true, runValidators: true }
  ).select('-password');

  if (!manager) {
    throw { statusCode: 404, message: 'Manager not found' };
  }

  return { manager };
};

module.exports = {
  getManagerProfile,
  updateManagerProfile
};
