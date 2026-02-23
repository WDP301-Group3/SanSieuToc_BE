/**
 * Validator utilities for common input validations
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Vietnam phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password format
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidPassword = (password) => {
  if (password.length < 8) {
    return false;
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate password match
 * @param {string} password - Original password
 * @param {string} confirmPassword - Password confirmation
 * @returns {boolean} - True if passwords match, false otherwise
 */
const isPasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Validate address length
 * @param {string} address - Address to validate
 * @param {number} minLength - Minimum length (default: 10)
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidAddress = (address, minLength = 10) => {
  return address && address.trim().length >= minLength;
};

/**
 * Validate required fields
 * @param {Object} data - Object containing fields to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - { isValid: boolean, missingFields: Array }
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isPasswordMatch,
  isValidAddress,
  validateRequiredFields
};
