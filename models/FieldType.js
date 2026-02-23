const mongoose = require('mongoose');

const fieldTypeSchema = new mongoose.Schema({
  typeName: {
    type: String,
    required: true,
    trim: true
  },
  categoryID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FieldType', fieldTypeSchema);
