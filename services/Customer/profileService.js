const Customer = require('../../models/Customer');
const { isValidPhone, isValidAddress } = require('../../utils/validators');
const { uploadImageBase64, deleteImage } = require('../../utils/cloudinaryConfig');

/**
 * Service: Get customer profile by ID
 */
const getCustomerProfile = async (customerId) => {
  const customer = await Customer.findById(customerId).select('-password');
  
  if (!customer) {
    throw { statusCode: 404, message: 'Customer not found' };
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
    throw { statusCode: 400, message: 'Name is required' };
  }

  // Validate phone format if provided
  if (phone) {
    if (!isValidPhone(phone)) {
      throw { 
        statusCode: 400, 
        message: 'Invalid phone number. Please enter correct format (e.g., 0901234567)' 
      };
    }

    // Check if phone already exists (except current user)
    const existingPhone = await Customer.findOne({ 
      phone, 
      _id: { $ne: customerId } 
    });
    if (existingPhone) {
      throw { statusCode: 400, message: 'Phone number already in use' };
    }
  }

  // Validate address if provided
  if (address && !isValidAddress(address)) {
    throw { statusCode: 400, message: 'Address must be at least 10 characters' };
  }

  // Update customer
  const updateFields = {
    name: name.trim()
  };
  
  if (phone) updateFields.phone = phone;
  if (address) updateFields.address = address.trim();
  
  // Upload profile image to Cloudinary if base64 provided
  if (image !== undefined) {
    if (image && image.startsWith('data:image/')) {
      // Delete old image from Cloudinary (if exists)
      const oldCustomer = await Customer.findById(customerId);
      if (oldCustomer && oldCustomer.image) {
        await deleteImage(oldCustomer.image);
      }
      
      // Upload new image to Cloudinary
      const imageUrl = await uploadImageBase64(image, 'customers', `customer_${customerId}`);
      updateFields.image = imageUrl;
    } else {
      // If not base64 (can be URL or empty string)
      updateFields.image = image;
    }
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    updateFields,
    { new: true, runValidators: true }
  ).select('-password');

  if (!customer) {
    throw { statusCode: 404, message: 'Customer not found' };
  }

  return { customer };
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile
};
