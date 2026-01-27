const mongoose = require('mongoose');

const fieldTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  slot_duration: {
    type: Number,
    required: true,
    enum: [30, 60]
  }
});

module.exports = mongoose.model('FieldType', fieldTypeSchema);
