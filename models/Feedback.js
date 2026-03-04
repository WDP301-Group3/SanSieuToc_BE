const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  bookingDetailID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingDetail',
    required: true,
    unique: true
  },
  rate: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  content: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'feedbacks'
});

module.exports = mongoose.model('Feedback', feedbackSchema);
