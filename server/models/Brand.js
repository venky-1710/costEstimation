const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  traderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound unique index for name + traderId
// This allows same brand names for different traders
brandSchema.index({ name: 1, traderId: 1 }, { unique: true });

module.exports = mongoose.model('Brand', brandSchema);
