const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  managerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    required: true
  },
  fieldTypeID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FieldType',
    required: true
  },
  fieldName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  slotDuration: {
    type: Number,
    required: true
  },
  openingTime: {
    type: String,
    required: true,
    default: '06:00'
  },
  closingTime: {
    type: String,
    required: true,
    default: '22:00'
  },
  hourlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Maintenance'],
    default: 'Available'
  },
  utilities: [{
    type: String
  }],
  image: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Field', fieldSchema);
