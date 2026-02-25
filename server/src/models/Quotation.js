const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, unique: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productTitle: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number },
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'],
      default: 'Draft',
    },
    subtotal: { type: Number, default: 0 },
    discountType: { type: String, enum: ['none', 'percentage', 'fixed'], default: 'none' },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    validUntil: { type: Date },
    notes: { type: String, default: '' },
    convertedToOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate quote number
quotationSchema.pre('save', async function (next) {
  if (!this.quoteNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quoteNumber = `QT-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => {
    item.total = item.quantity * item.unitPrice;
    return sum + item.total;
  }, 0);

  if (this.discountType === 'percentage' && this.discountValue > 0) {
    this.discountAmount = Math.round((this.subtotal * this.discountValue / 100) * 100) / 100;
  } else if (this.discountType === 'fixed' && this.discountValue > 0) {
    this.discountAmount = this.discountValue;
  } else {
    this.discountAmount = 0;
  }

  const afterDiscount = this.subtotal - this.discountAmount;
  if (this.taxRate > 0) {
    this.tax = Math.round((afterDiscount * this.taxRate / 100) * 100) / 100;
  }
  this.totalPrice = afterDiscount + this.tax;

  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
