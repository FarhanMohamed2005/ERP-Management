const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'status_change', 'login'],
      required: true,
    },
    entity: {
      type: String,
      enum: ['Product', 'Customer', 'Supplier', 'SalesOrder', 'PurchaseOrder', 'GRN', 'Invoice', 'User', 'CreditNote', 'Quotation', 'Expense', 'Payment'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
