const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const [overdueInvoices, lowStockProducts, pendingApprovals] = await Promise.all([
    Invoice.find({ status: 'Unpaid', dueDate: { $lt: new Date() } })
      .populate('customer', 'name')
      .select('invoiceNumber customer total dueDate')
      .sort({ dueDate: 1 })
      .limit(10)
      .lean(),
    Product.find({ $expr: { $lte: ['$stock', '$reorderLevel'] } })
      .select('title sku stock reorderLevel')
      .sort({ stock: 1 })
      .limit(10)
      .lean(),
    PurchaseOrder.countDocuments({ status: 'Draft' }),
  ]);

  const notifications = [];

  overdueInvoices.forEach((inv) => {
    notifications.push({
      id: `inv-${inv._id}`,
      type: 'overdue',
      severity: 'error',
      title: `Overdue Invoice ${inv.invoiceNumber}`,
      message: `$${inv.total.toFixed(2)} from ${inv.customer?.name || 'Unknown'} — due ${new Date(inv.dueDate).toLocaleDateString()}`,
      link: '/invoices',
      createdAt: inv.dueDate,
    });
  });

  lowStockProducts.forEach((p) => {
    notifications.push({
      id: `stock-${p._id}`,
      type: 'low_stock',
      severity: p.stock === 0 ? 'error' : 'warning',
      title: p.stock === 0 ? `Out of Stock: ${p.title}` : `Low Stock: ${p.title}`,
      message: `${p.stock} remaining (reorder at ${p.reorderLevel})`,
      link: '/low-stock',
      createdAt: new Date(),
    });
  });

  if (pendingApprovals > 0) {
    notifications.push({
      id: 'po-drafts',
      type: 'pending',
      severity: 'info',
      title: 'Pending Purchase Orders',
      message: `${pendingApprovals} purchase order${pendingApprovals > 1 ? 's' : ''} awaiting approval`,
      link: '/purchase-orders',
      createdAt: new Date(),
    });
  }

  res.json({
    success: true,
    data: notifications,
    count: notifications.length,
  });
});
