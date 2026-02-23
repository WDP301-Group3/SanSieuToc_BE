const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  imageQR: {
    type: String,
    default: '' // Store base64 of QR image uploaded by manager
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Manager', managerSchema);
