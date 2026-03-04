const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../../models/Customer');
const { 
  isValidEmail, 
  isValidPhone, 
  isValidPassword, 
  isPasswordMatch, 
  isValidAddress,
  validateRequiredFields,
  generateRandomPassword
} = require('../../utils/validators');
const { sendResetPasswordEmail } = require('../../utils/emailConfig');

/**
 * Service: Register new customer
 */
const registerCustomer = async (customerData) => {
  const { email, password, confirmPassword, name, phone, address, image } = customerData;

  // Validate required fields
  const requiredFieldsCheck = validateRequiredFields(customerData, 
    ['email', 'password', 'confirmPassword', 'name', 'phone']
  );
  if (!requiredFieldsCheck.isValid) {
    throw { 
      statusCode: 400, 
      message: `The following fields are required: ${requiredFieldsCheck.missingFields.join(', ')}` 
    };
  }

  // Validate email format
  if (!isValidEmail(email)) {
    throw { statusCode: 400, message: 'Invalid email' };
  }

  // Validate phone format (Vietnam phone number)
  if (!isValidPhone(phone)) {
    throw { 
      statusCode: 400, 
      message: 'Invalid phone number. Please enter correct format (e.g., 0901234567)' 
    };
  }

  // Validate password format
  if (!isValidPassword(password)) {
    throw { 
      statusCode: 400, 
      message: 'Password must be at least 8 characters, including uppercase, lowercase, number and special character (@$!%*?&#)' 
    };
  }

  // Validate password match
  if (!isPasswordMatch(password, confirmPassword)) {
    throw { statusCode: 400, message: 'Confirm password does not match' };
  }

  // Validate address length if provided
  if (address && !isValidAddress(address)) {
    throw { statusCode: 400, message: 'Address must be at least 10 characters' };
  }

  // Check if customer already exists
  const existingCustomer = await Customer.findOne({ email });
  if (existingCustomer) {
    throw { statusCode: 400, message: 'Email already in use' };
  }

  // Check if phone already exists
  const existingPhone = await Customer.findOne({ phone });
  if (existingPhone) {
    throw { statusCode: 400, message: 'Phone number already in use' };
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new customer
  const customer = new Customer({
    email,
    password: hashedPassword,
    name,
    phone,
    address: address || '',
    image: image || ''
  });

  await customer.save();

  // Generate JWT token
  const token = jwt.sign(
    { id: customer._id, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    customer: {
      id: customer._id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      image: customer.image
    },
    token
  };
};

/**
 * Service: Login customer
 */
const loginCustomer = async (credentials) => {
  const { email, password } = credentials;

  // Validate input
  if (!email || !password) {
    throw { statusCode: 400, message: 'Email and password are required' };
  }

  // Find customer
  const customer = await Customer.findOne({ email });
  if (!customer) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, customer.password);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  // Check account status
  if (customer.status === 'Banned') {
    throw { statusCode: 403, message: 'Tài khoản đã bị cấm. Vui lòng liên hệ quản trị viên' };
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: customer._id, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    customer: {
      id: customer._id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      image: customer.image
    },
    token
  };
};

/**
 * Service: Change customer password
 */
const changeCustomerPassword = async (customerId, passwordData) => {
  const { currentPassword, newPassword, confirmNewPassword } = passwordData;

  // Validate input
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw { statusCode: 400, message: 'Please fill in all fields' };
  }

  // Validate new password format
  if (!isValidPassword(newPassword)) {
    throw { 
      statusCode: 400, 
      message: 'New password must be at least 8 characters, including uppercase, lowercase, number and special character (@$!%*?&#)' 
    };
  }

  // Validate password match
  if (newPassword !== confirmNewPassword) {
    throw { statusCode: 400, message: 'Confirm password does not match' };
  }

  // Find customer
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw { statusCode: 404, message: 'Customer not found' };
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, customer.password);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Current password is incorrect' };
  }

  // Check if new password is same as current password
  const isSamePassword = await bcrypt.compare(newPassword, customer.password);
  if (isSamePassword) {
    throw { statusCode: 400, message: 'New password must be different from current password' };
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  customer.password = hashedPassword;
  await customer.save();

  return {
    message: 'Password changed successfully'
  };
};

/**
 * Service: Reset customer password (forgot password)
 */
const resetCustomerPassword = async (email) => {
  // Validate input
  if (!email) {
    throw { statusCode: 400, message: 'Email is required' };
  }

  // Find customer by email
  const customer = await Customer.findOne({ email });
  if (!customer) {
    throw { statusCode: 404, message: 'Email does not exist in the system' };
  }

  // Generate new random password
  const newPassword = generateRandomPassword(12);

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password in database
  customer.password = hashedPassword;
  await customer.save();

  // Send email with new password
  try {
    await sendResetPasswordEmail(customer.email, newPassword, customer.name);
    return {
      message: 'New password has been sent to your email',
      newPassword: process.env.NODE_ENV === 'development' ? newPassword : undefined
    };
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    // If email fails, still return success with the password (for development)
    return {
      message: 'Password has been reset. New password: ' + newPassword,
      newPassword: newPassword,
      emailSent: false
    };
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  changeCustomerPassword,
  resetCustomerPassword
};
