const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Banned'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
