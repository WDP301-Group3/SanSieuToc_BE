const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../../models/Customer');
const { 
  isValidEmail, 
  isValidPhone, 
  isValidPassword, 
  isPasswordMatch, 
  isValidAddress,
  validateRequiredFields 
} = require('../../utils/validators');

/**
 * Service: Register new customer
 */
const registerCustomer = async (customerData) => {
  const { email, password, confirmPassword, name, phone, address, image } = customerData;

  // Validate required fields
  const requiredFieldsCheck = validateRequiredFields(customerData, 
    ['email', 'password', 'confirmPassword', 'name', 'phone', 'address']
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

  // Validate address length
  if (!isValidAddress(address)) {
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
    address,
    image: image || ''
  });

  await customer.save();

  // Generate JWT token
  const token = jwt.sign(
    { id: customer._id, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
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

  // Generate JWT token
  const token = jwt.sign(
    { id: customer._id, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
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

module.exports = {
  registerCustomer,
  loginCustomer
};
