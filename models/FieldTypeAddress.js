const mongoose = require('mongoose');

const fieldTypeAddressSchema = new mongoose.Schema({
  field_address_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FieldAddress',
    required: true
  },
  field_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FieldType',
    required: true
  }
});

module.exports = mongoose.model('FieldTypeAddress', fieldTypeAddressSchema);
