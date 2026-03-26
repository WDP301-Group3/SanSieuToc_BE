/**
 * Booking Helper Functions
 */

/**
 * Generate time slots for a field
 * @param {String} openingTime - Format: "08:00"
 * @param {String} closingTime - Format: "22:00"
 * @param {Number} slotDuration - Duration in minutes
 * @param {Number} breakTime - Break time between slots in minutes (default: 10)
 * @returns {Array} Array of time slots
 */
const generateTimeSlots = (openingTime, closingTime, slotDuration, breakTime = 10) => {
  const slots = [];
  const [openHour, openMin] = openingTime.split(':').map(Number);
  const [closeHour, closeMin] = closingTime.split(':').map(Number);
  
  let currentMinutes = openHour * 60 + openMin;
  const closingMinutes = closeHour * 60 + closeMin;
  
  while (currentMinutes + slotDuration <= closingMinutes) {
    const startHour = Math.floor(currentMinutes / 60);
    const startMin = currentMinutes % 60;
    
    const endMinutes = currentMinutes + slotDuration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    
    slots.push({
      startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
      endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
    });
    
    // Add slot duration + break time
    currentMinutes += slotDuration + breakTime;
  }
  
  return slots;
};

/**
 * Generate full datetime slots for a specific date
 * @param {String} date - Format: "2026-02-25"
 * @param {Array} timeSlots - Array of {startTime, endTime}
 * @returns {Array} Array of datetime slots
 */
const generateDateTimeSlots = (date, timeSlots) => {
  return timeSlots.map(slot => ({
    startTime: new Date(`${date}T${slot.startTime}:00`),
    endTime: new Date(`${date}T${slot.endTime}:00`)
  }));
};

/**
 * Generate dates based on repeat type
 * @param {Date} startDate - Starting date
 * @param {String} repeatType - "once", "weekly", "recurring"
 * @param {Number} duration - Duration in months (1, 2, 3) for recurring
 * @returns {Array} Array of dates
 */
const generateBookingDates = (startDate, repeatType, duration = 0) => {
  const dates = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  if (repeatType === 'once') {
    dates.push(new Date(start));
  } 
  else if (repeatType === 'weekly') {
    // Book same slot for all days in one week
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
  } 
  else if (repeatType === 'recurring') {
    // Book same slot every week for X months
    const weeks = duration * 4; // Convert months to weeks (1 month = 4 weeks)
    for (let week = 0; week < weeks; week++) {
      const date = new Date(start);
      date.setDate(date.getDate() + (week * 7));
      dates.push(date);
    }
  }
  
  return dates;
};

/**
 * Check if a date is in the past
 * @param {Date} date
 * @returns {Boolean}
 */
const isPastDate = (date) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < now;
};

/**
 * Check if a datetime is in the past
 * @param {Date} datetime
 * @returns {Boolean}
 */
const isPastDateTime = (datetime) => {
  return new Date(datetime) < new Date();
};

/**
 * Calculate price for a slot
 * hourlyPrice is actually the price per slot (not per hour)
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {Number} hourlyPrice - Price per slot (fixed price)
 * @returns {Number}
 */
const calculateSlotPrice = (startTime, endTime, hourlyPrice) => {
  return hourlyPrice; // hourlyPrice is the fixed price per slot
};

/**
 * Calculate deposit amount (30% of total)
 * @param {Number} totalPrice
 * @returns {Number}
 */
const calculateDepositAmount = (totalPrice) => {
  return Math.round(totalPrice * 0.3);
};

/**
 * Get maximum allowed booking year based on current date.
 * Rule:
 * - Jan..Nov: allow bookings only within current year
 * - Dec: allow bookings within current year and next year
 * @param {Date} [now]
 * @returns {number}
 */
const getMaxBookingYear = (now = new Date()) => {
  const d = new Date(now);
  const currentYear = d.getFullYear();
  const isDecember = d.getMonth() === 11;
  return isDecember ? currentYear + 1 : currentYear;
};

const getYearFromDateInput = (dateInput) => {
  if (typeof dateInput === 'string') {
    // Common formats from FE / query: YYYY-MM-DD
    const m = /^\d{4}-\d{2}-\d{2}$/.exec(dateInput);
    if (m) return Number(dateInput.slice(0, 4));
  }
  return new Date(dateInput).getFullYear();
};

/**
 * Assert booking dates are within allowed year window.
 * Throws an object shaped like other service errors: { statusCode, message }
 * @param {Array<Date|string>} dates
 * @param {Date} [now]
 */
const assertBookingDatesWithinAllowedYears = (dates, now = new Date()) => {
  const d = new Date(now);
  const currentYear = d.getFullYear();
  const isDecember = d.getMonth() === 11;
  const maxYear = getMaxBookingYear(d);

  for (const date of dates || []) {
    const year = getYearFromDateInput(date);
    if (Number.isNaN(year)) {
      throw { statusCode: 400, message: 'Ngày đặt sân không hợp lệ' };
    }
    if (year > maxYear) {
      const message = isDecember
        ? `Chỉ có thể đặt sân đến hết năm ${maxYear}.`
        : `Hiện chỉ mở đặt sân đến hết năm ${currentYear}. Năm ${currentYear + 1} sẽ mở đặt từ tháng 12.`;
      throw { statusCode: 400, message };
    }
  }
};

/**
 * Format date to string
 * @param {Date} date
 * @returns {String} Format: "YYYY-MM-DD"
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format datetime to display string
 * @param {Date} datetime
 * @returns {String} Format: "DD/MM/YYYY HH:mm"
 */
const formatDateTime = (datetime) => {
  const d = new Date(datetime);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Check if booking should be auto-completed
 * @param {Date} endTime
 * @returns {Boolean}
 */
const shouldAutoComplete = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const tenMinutesAfterEnd = new Date(end.getTime() + 10 * 60 * 1000);
  return now >= tenMinutesAfterEnd;
};

module.exports = {
  generateTimeSlots,
  generateDateTimeSlots,
  generateBookingDates,
  isPastDate,
  isPastDateTime,
  calculateSlotPrice,
  calculateDepositAmount,
  getMaxBookingYear,
  assertBookingDatesWithinAllowedYears,
  formatDate,
  formatDateTime,
  shouldAutoComplete
};
