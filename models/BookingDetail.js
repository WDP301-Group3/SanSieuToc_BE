const mongoose = require('mongoose');

const bookingDetailSchema = new mongoose.Schema({
  field_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
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
