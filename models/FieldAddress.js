const mongoose = require('mongoose');

const fieldAddressSchema = new mongoose.Schema({
  address_name: {
    type: String,
    required: true,
    trim: true
  },
  opening_time: {
    type: String,
    required: true,
    default: '06:00'
  },
  closing_time: {
    type: String,
    required: true,
    default: '22:00'
  },
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FieldAddress', fieldAddressSchema);
