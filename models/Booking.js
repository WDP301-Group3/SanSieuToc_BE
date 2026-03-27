const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  fieldID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: false,
    default: null,
    index: true
  },
  customerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  repeatType: {
    type: String,
    enum: ['once', 'weekly', 'recurring'],
    default: 'once'
  },
  durationMonths: {
    type: Number,
    default: 0,
    min: 0
  },
  contractStartAt: {
    type: Date,
    default: null,
    index: true
  },
  contractEndAt: {
    type: Date,
    default: null,
    index: true
  },
  holdUntil: {
    type: Date,
    default: null,
    index: true
  },
  renewalState: {
    type: String,
    enum: ['Active', 'ReminderSent', 'Released', 'Renewed'],
    default: 'Active',
    index: true
  },
  renewalReminderSentAt: {
    type: Date,
    default: null,
    index: true
  },
  renewedFromBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
    index: true
  },
  depositConfirmedAt: {
    type: Date,
    default: null,
    index: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending'
  },
  statusPayment: {
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
