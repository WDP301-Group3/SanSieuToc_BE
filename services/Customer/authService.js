const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../../models/Customer');

/**
 * Service: Register new customer
 */
const registerCustomer = async (customerData) => {
  const { email, password, confirmPassword, name, phone, address, image } = customerData;

  // Validate required fields
  if (!email || !password || !confirmPassword || !name || !phone || !address) {
    throw { 
      statusCode: 400, 
      message: 'Email, password, confirmPassword, name, phone và address là bắt buộc' 
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw { statusCode: 400, message: 'Email không hợp lệ' };
  }

  // Validate phone format (Vietnam phone number)
  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
  if (!phoneRegex.test(phone)) {
    throw { 
      statusCode: 400, 
      message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng (VD: 0901234567)' 
    };
  }

  // Validate password format
  if (password.length < 8) {
    throw { statusCode: 400, message: 'Mật khẩu phải có ít nhất 8 ký tự' };
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw { 
      statusCode: 400, 
      message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&#)' 
    };
  }

  // Validate password match
  if (password !== confirmPassword) {
    throw { statusCode: 400, message: 'Mật khẩu xác nhận không khớp' };
  }

  // Validate address length
  if (address.trim().length < 10) {
    throw { statusCode: 400, message: 'Địa chỉ phải có ít nhất 10 ký tự' };
  }

  // Check if customer already exists
  const existingCustomer = await Customer.findOne({ email });
  if (existingCustomer) {
    throw { statusCode: 400, message: 'Email đã được sử dụng' };
  }

  // Check if phone already exists
  const existingPhone = await Customer.findOne({ phone });
  if (existingPhone) {
    throw { statusCode: 400, message: 'Số điện thoại đã được sử dụng' };
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
    throw { statusCode: 400, message: 'Email và password là bắt buộc' };
  }

  // Find customer
  const customer = await Customer.findOne({ email });
  if (!customer) {
    throw { statusCode: 401, message: 'Email hoặc mật khẩu không đúng' };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, customer.password);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Email hoặc mật khẩu không đúng' };
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
