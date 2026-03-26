const mongoose = require('mongoose');

const slotHoldSchema = new mongoose.Schema({
  fieldID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  seriesBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Held', 'Released', 'Converted'],
    default: 'Held',
    index: true
  },
  holdUntil: {
    type: Date,
    default: null,
    index: true
  },
  convertedToBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  releasedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Prevent double-holding the same slot.
// Keep released/converted records for audit/history.
slotHoldSchema.index(
  { fieldID: 1, startTime: 1, endTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'Held' }
  }
);

slotHoldSchema.index({ seriesBookingId: 1, status: 1, startTime: 1 });
slotHoldSchema.index({ holdUntil: 1, status: 1 });

module.exports = mongoose.model('SlotHold', slotHoldSchema);
