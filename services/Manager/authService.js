const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Manager = require('../../models/Manager');

/**
 * Service: Login manager
 */
const loginManager = async (credentials) => {
  const { email, password } = credentials;

  // Validate input
  if (!email || !password) {
    throw { statusCode: 400, message: 'Email and password are required' };
  }

  // Find manager
  const manager = await Manager.findOne({ email });
  if (!manager) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, manager.password);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: manager._id, role: 'manager' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    manager: {
      id: manager._id,
      email: manager.email,
      name: manager.name,
      image: manager.image
    },
    token
  };
};

module.exports = {
  loginManager
};
