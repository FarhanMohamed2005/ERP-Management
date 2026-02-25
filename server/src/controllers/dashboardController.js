const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalProducts,
    totalCustomers,
    totalSalesOrders,
    totalPurchaseOrders,
    lowStockProducts,
    salesOrders,
    invoices,
    recentSalesOrders,
    recentPurchaseOrders,
  ] = await Promise.all([
    Product.countDocuments(),
    Customer.countDocuments(),
    SalesOrder.countDocuments(),
    PurchaseOrder.countDocuments(),
    Product.countDocuments({ $expr: { $lte: ['$stock', '$reorderLevel'] } }),
    SalesOrder.find({ status: { $ne: 'Cancelled' } }).select('totalPrice createdAt'),
    Invoice.find().select('total status'),
    SalesOrder.find()
      .populate('customer', 'name company')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber customer totalPrice status createdAt'),
    PurchaseOrder.find()
      .populate('supplier', 'name company')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber supplier totalPrice status createdAt'),
  ]);

  const totalRevenue = salesOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid');
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const unpaidInvoices = invoices.filter((inv) => inv.status === 'Unpaid');
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Monthly revenue for chart (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenue = await SalesOrder.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Order status distribution
  const salesStatusDist = await SalesOrder.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalProducts,
        totalCustomers,
        totalSalesOrders,
        totalPurchaseOrders,
        lowStockProducts,
        totalRevenue,
        totalPaid,
        totalUnpaid,
      },
      monthlyRevenue,
      salesStatusDistribution: salesStatusDist,
      recentSalesOrders,
      recentPurchaseOrders,
    },
  });
});
