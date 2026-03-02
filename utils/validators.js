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

// ==================== FIELD VALIDATION FUNCTIONS ====================

/**
 * Validate field name
 * Rules: 10-100 characters, no special characters except Vietnamese, spaces, numbers, hyphen, parentheses
 * @param {string} fieldName - Field name to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateFieldName = (fieldName) => {
  if (!fieldName || typeof fieldName !== 'string') {
    return { isValid: false, message: 'fieldName is required' };
  }

  const trimmed = fieldName.trim();

  if (trimmed.length < 10) {
    return { isValid: false, message: 'fieldName must be at least 10 characters' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, message: 'fieldName must not exceed 100 characters' };
  }

  // Allow Vietnamese characters, letters, numbers, spaces, hyphen, parentheses
  const validNameRegex = /^[\p{L}\p{N}\s\-()]+$/u;
  if (!validNameRegex.test(trimmed)) {
    return { isValid: false, message: 'fieldName contains invalid characters. Only letters, numbers, spaces, hyphens, and parentheses are allowed' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate address for field
 * Rules: 10-500 characters
 * @param {string} address - Address to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateFieldAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, message: 'address is required' };
  }

  const trimmed = address.trim();

  if (trimmed.length < 10) {
    return { isValid: false, message: 'address must be at least 10 characters' };
  }

  if (trimmed.length > 500) {
    return { isValid: false, message: 'address must not exceed 500 characters' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate description
 * Rules: 0-2000 characters, if provided must be at least 10 characters
 * @param {string} description - Description to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateDescription = (description) => {
  if (description === undefined || description === null || description === '') {
    return { isValid: true, message: '' }; // Optional field
  }

  if (typeof description !== 'string') {
    return { isValid: false, message: 'description must be a string' };
  }

  const trimmed = description.trim();

  if (trimmed.length > 0 && trimmed.length < 10) {
    return { isValid: false, message: 'description must be at least 10 characters if provided' };
  }

  if (trimmed.length > 2000) {
    return { isValid: false, message: 'description must not exceed 2000 characters' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate slot duration
 * Rules: 60-480 minutes (1-8 hours)
 * @param {number} slotDuration - Slot duration in minutes
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateSlotDuration = (slotDuration) => {
  if (slotDuration === undefined || slotDuration === null) {
    return { isValid: false, message: 'slotDuration is required' };
  }

  if (typeof slotDuration !== 'number' || !Number.isInteger(slotDuration)) {
    return { isValid: false, message: 'slotDuration must be an integer' };
  }

  if (slotDuration < 60) {
    return { isValid: false, message: 'slotDuration must be at least 60 minutes' };
  }

  if (slotDuration > 480) {
    return { isValid: false, message: 'slotDuration must not exceed 480 minutes (8 hours)' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate hourly price
 * Rules: > 0, max 10,000,000 VND, max 2 decimal places
 * @param {number} hourlyPrice - Hourly price to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateHourlyPrice = (hourlyPrice) => {
  if (hourlyPrice === undefined || hourlyPrice === null) {
    return { isValid: false, message: 'hourlyPrice is required' };
  }

  if (typeof hourlyPrice !== 'number') {
    return { isValid: false, message: 'hourlyPrice must be a number' };
  }

  if (hourlyPrice <= 0) {
    return { isValid: false, message: 'hourlyPrice must be greater than 0' };
  }

  if (hourlyPrice > 10000000) {
    return { isValid: false, message: 'hourlyPrice must not exceed 10,000,000 VND' };
  }

  // Check max 2 decimal places
  const decimalParts = hourlyPrice.toString().split('.');
  if (decimalParts[1] && decimalParts[1].length > 2) {
    return { isValid: false, message: 'hourlyPrice must have at most 2 decimal places' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate opening and closing time
 * Rules: HH:MM format, opening < closing, minimum 3 hour window, reasonable hours (05:00-23:59)
 * @param {string} openingTime - Opening time
 * @param {string} closingTime - Closing time
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateBusinessHours = (openingTime, closingTime) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

  if (!openingTime || !timeRegex.test(openingTime)) {
    return { isValid: false, message: 'openingTime must be in HH:MM format' };
  }

  if (!closingTime || !timeRegex.test(closingTime)) {
    return { isValid: false, message: 'closingTime must be in HH:MM format' };
  }

  const [openHour, openMin] = openingTime.split(':').map(Number);
  const [closeHour, closeMin] = closingTime.split(':').map(Number);

  // Validate reasonable opening hours (05:00 - 23:00)
  if (openHour < 5) {
    return { isValid: false, message: 'openingTime cannot be earlier than 05:00' };
  }

  // Opening must be before closing
  if (openHour > closeHour || (openHour === closeHour && openMin >= closeMin)) {
    return { isValid: false, message: 'openingTime must be before closingTime' };
  }

  // Minimum 3 hour business window
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  if (closeMinutes - openMinutes < 180) {
    return { isValid: false, message: 'Business must be open for at least 3 hours' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate utilities array
 * Rules: Array of strings, max 20 items, each item 2-100 chars, no duplicates
 * @param {Array} utilities - Array of utility strings
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateUtilities = (utilities) => {
  if (utilities === undefined || utilities === null) {
    return { isValid: true, message: '' }; // Optional field
  }

  if (!Array.isArray(utilities)) {
    return { isValid: false, message: 'utilities must be an array' };
  }

  if (utilities.length > 20) {
    return { isValid: false, message: 'utilities must not exceed 20 items' };
  }

  // Check each utility
  for (let i = 0; i < utilities.length; i++) {
    const utility = utilities[i];

    if (typeof utility !== 'string') {
      return { isValid: false, message: 'Each utility must be a string' };
    }

    const trimmed = utility.trim();

    if (trimmed.length < 2) {
      return { isValid: false, message: `Utility at index ${i} must be at least 2 characters` };
    }

    if (trimmed.length > 100) {
      return { isValid: false, message: `Utility at index ${i} must not exceed 100 characters` };
    }
  }

  // Check for duplicates (case-insensitive)
  const normalizedUtilities = utilities.map(u => u.trim().toLowerCase());
  const uniqueUtilities = new Set(normalizedUtilities);
  if (uniqueUtilities.size !== utilities.length) {
    return { isValid: false, message: 'utilities must not contain duplicates' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate image URLs array
 * Rules: Array of strings, 1-5 items, valid URL format, no empty strings, no duplicates
 * @param {Array} images - Array of image URLs
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateFieldImages = (images) => {
  if (!images || !Array.isArray(images)) {
    return { isValid: false, message: 'image must be an array' };
  }

  if (images.length < 1) {
    return { isValid: false, message: 'At least 1 image is required' };
  }

  if (images.length > 5) {
    return { isValid: false, message: 'Maximum 5 images allowed' };
  }

  // URL pattern for validation (http, https, or cloudinary URLs)
  const urlPattern = /^(https?:\/\/|data:image\/)/i;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    if (typeof img !== 'string') {
      return { isValid: false, message: `Image at index ${i} must be a string` };
    }

    const trimmed = img.trim();

    if (trimmed.length === 0) {
      return { isValid: false, message: `Image at index ${i} cannot be empty` };
    }

    if (!urlPattern.test(trimmed)) {
      return { isValid: false, message: `Image at index ${i} must be a valid URL (http, https, or data:image)` };
    }

    if (trimmed.length > 2000) {
      return { isValid: false, message: `Image URL at index ${i} is too long (max 2000 characters)` };
    }
  }

  // Check for duplicate URLs
  const uniqueImages = new Set(images.map(img => img.trim().toLowerCase()));
  if (uniqueImages.size !== images.length) {
    return { isValid: false, message: 'Image URLs must be unique, no duplicates allowed' };
  }

  return { isValid: true, message: '' };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isPasswordMatch,
  isValidAddress,
  validateRequiredFields,
  // Field validators
  validateFieldName,
  validateFieldAddress,
  validateDescription,
  validateSlotDuration,
  validateHourlyPrice,
  validateBusinessHours,
  validateUtilities,
  validateFieldImages
};
