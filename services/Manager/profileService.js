const Manager = require('../../models/Manager');

/**
 * Service: Get manager profile by ID
 */
const getManagerProfile = async (managerId) => {
  const manager = await Manager.findById(managerId).select('-password');
  
  if (!manager) {
    throw { statusCode: 404, message: 'Không tìm thấy manager' };
  }

  return { manager };
};

/**
 * Service: Update manager profile
 */
const updateManagerProfile = async (managerId, updateData) => {
  const { name, image } = updateData;

  // Validate input
  if (!name || name.trim().length === 0) {
    throw { statusCode: 400, message: 'Tên không được để trống' };
  }

  // Update manager
  const manager = await Manager.findByIdAndUpdate(
    managerId,
    { name: name.trim(), image: image || '' },
    { new: true, runValidators: true }
  ).select('-password');

  if (!manager) {
    throw { statusCode: 404, message: 'Không tìm thấy manager' };
  }

  return { manager };
};

module.exports = {
  getManagerProfile,
  updateManagerProfile
};
