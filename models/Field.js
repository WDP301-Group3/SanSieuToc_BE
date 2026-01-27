const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  }
}, { _id: false });

const fieldSchema = new mongoose.Schema({
  field_name: {
    type: String,
    required: true,
    trim: true
  },
  field_type_address_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FieldTypeAddress',
    required: true
  },
  hourly_price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance'],
    default: 'Active'
  },
  images: [imageSchema],
  description: {
    type: String,
    default: ''
  },
  utilities: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Field', fieldSchema);
