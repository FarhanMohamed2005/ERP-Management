const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema(
  {
    creditNoteNumber: { type: String, unique: true },
    salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [
      {
        productTitle: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number },
      },
    ],
    reason: { type: String, required: [true, 'Return reason is required'], trim: true },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'Refunded', 'Cancelled'],
      default: 'Draft',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

creditNoteSchema.pre('save', async function (next) {
  if (!this.creditNoteNumber) {
    const count = await mongoose.model('CreditNote').countDocuments();
    this.creditNoteNumber = `CN-${String(count + 1).padStart(5, '0')}`;
  }
  this.subtotal = this.items.reduce((sum, item) => {
    item.total = item.quantity * item.unitPrice;
    return sum + item.total;
  }, 0);
  this.total = this.subtotal + this.tax;
  next();
});

module.exports = mongoose.model('CreditNote', creditNoteSchema);
