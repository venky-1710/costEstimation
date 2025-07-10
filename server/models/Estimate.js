const mongoose = require('mongoose');

const estimateItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: 0
  },
  total: {
    type: Number,
    required: true
  }
});

const estimateSchema = new mongoose.Schema({
  estimateNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  traderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [estimateItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'amount'],
    default: 'percentage'
  },
  loadingCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true
  },
  validTill: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'converted', 'expired'],
    default: 'draft'
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  isConverted: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  sentVia: [{
    type: String,
    enum: ['email', 'whatsapp', 'print']
  }],
  viewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate estimate number before saving
estimateSchema.pre('save', async function(next) {
  if (!this.estimateNumber) {
    try {
      const count = await mongoose.model('Estimate').countDocuments({ traderId: this.traderId });
      const year = new Date().getFullYear();
      this.estimateNumber = `EST-${year}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating estimate number:', error);
      // Fallback to timestamp if count fails
      const timestamp = Date.now().toString().slice(-6);
      this.estimateNumber = `EST-${new Date().getFullYear()}-${timestamp}`;
    }
  }
  next();
});

module.exports = mongoose.model('Estimate', estimateSchema);
