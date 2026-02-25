const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: [true, 'Sales Order is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    items: [
      {
        productTitle: { type: String },
        quantity: { type: Number },
        unitPrice: { type: Number },
        total: { type: Number },
      },
    ],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Unpaid', 'Partial', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Unpaid',
    },
    paidAmount: { type: Number, default: 0 },
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
