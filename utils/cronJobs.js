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

/**
 * Cron jobs for recurring contract renewal lifecycle
 * - Reminder at T-14 days before contract end
 * - Release held slots at T-7 days before contract end if renewal deposit not confirmed
 */
const startRenewalJobs = () => {
  // Daily at 09:00 Vietnam time
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('🔔 Running contract expiry reminder job (T-14)...');
      const result = await bookingService.sendRecurringContractExpiryReminders();
      console.log(`✅ Reminder job done | sent=${result.sent}/${result.total}`);
    } catch (error) {
      console.error('❌ Error in reminder job:', error);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // Daily at 00:05 Vietnam time
  cron.schedule('5 0 * * *', async () => {
    try {
      console.log('⏳ Running held-slot release job (T-7)...');
      const result = await bookingService.releaseHeldSlotsBeforeExpiry();
      console.log(`✅ Release job done | releasedBookings=${result.releasedBookings}/${result.total}, releasedHolds=${result.releasedHolds}`);
    } catch (error) {
      console.error('❌ Error in release job:', error);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  console.log('⏰ Renewal reminder/release jobs scheduled');
};

module.exports = {
  startAutoCompleteJob,
  startRenewalJobs
};
