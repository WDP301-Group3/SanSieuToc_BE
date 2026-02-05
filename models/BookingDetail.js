const mongoose = require('mongoose');

const bookingDetailSchema = new mongoose.Schema({
  fieldID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  bookingID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  priceSnapshot: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Cancelled'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BookingDetail', bookingDetailSchema);
