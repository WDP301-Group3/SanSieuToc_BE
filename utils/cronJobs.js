const cron = require('node-cron');
const bookingService = require('../services/Customer/bookingService');

/**
 * Cron job to auto-complete bookings
 * Runs every 10 minutes
 */
const startAutoCompleteJob = () => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('🔄 Running auto-complete booking job...');
      const result = await bookingService.autoCompleteBookings();
      console.log(`✅ ${result.message}`);
    } catch (error) {
      console.error('❌ Error in auto-complete booking job:', error);
    }
  });

  console.log('⏰ Auto-complete booking job scheduled (every 10 minutes)');
};

module.exports = {
  startAutoCompleteJob
};
