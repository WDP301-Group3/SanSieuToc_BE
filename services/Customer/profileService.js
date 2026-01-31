const Customer = require('../../models/Customer');

/**
 * Service: Get customer profile by ID
 */
const getCustomerProfile = async (customerId) => {
  const customer = await Customer.findById(customerId).select('-password');
  
  if (!customer) {
    throw { statusCode: 404, message: 'Không tìm thấy customer' };
  }

  return { customer };
};

/**
 * Service: Update customer profile
 */
const updateCustomerProfile = async (customerId, updateData) => {
  const { name, phone, address, image } = updateData;

  // Validate required fields
  if (!name || name.trim().length === 0) {
    throw { statusCode: 400, message: 'Tên không được để trống' };
  }

  // Validate phone format if provided
  if (phone) {
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(phone)) {
      throw { 
        statusCode: 400, 
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng (VD: 0901234567)' 
      };
    }

    // Check if phone already exists (except current user)
    const existingPhone = await Customer.findOne({ 
      phone, 
      _id: { $ne: customerId } 
    });
    if (existingPhone) {
      throw { statusCode: 400, message: 'Số điện thoại đã được sử dụng' };
    }
  }

  // Validate address if provided
  if (address && address.trim().length < 10) {
    throw { statusCode: 400, message: 'Địa chỉ phải có ít nhất 10 ký tự' };
  }

  // Update customer
  const updateFields = {
    name: name.trim()
  };
  
  if (phone) updateFields.phone = phone;
  if (address) updateFields.address = address.trim();
  if (image !== undefined) updateFields.image = image;

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    updateFields,
    { new: true, runValidators: true }
  ).select('-password');

  if (!customer) {
    throw { statusCode: 404, message: 'Không tìm thấy customer' };
  }

  return { customer };
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile
};
