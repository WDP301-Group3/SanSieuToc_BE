const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  deposit_amount: {
    type: Number,
    required: true,
    min: 0
  },
  booking_date: {
    type: Date,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Paid', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
