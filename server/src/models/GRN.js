const mongoose = require('mongoose');

const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      unique: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase Order is required'],
    },
    receivedItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productTitle: { type: String },
        orderedQuantity: { type: Number, required: true },
        receivedQuantity: { type: Number, required: true, min: 0 },
      },
    ],
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

grnSchema.pre('save', async function (next) {
  if (!this.grnNumber) {
    const count = await mongoose.model('GRN').countDocuments();
    this.grnNumber = `GRN-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

grnSchema.index({ grnNumber: 1 });
grnSchema.index({ purchaseOrder: 1 });
grnSchema.index({ receivedDate: -1 });

module.exports = mongoose.model('GRN', grnSchema);
