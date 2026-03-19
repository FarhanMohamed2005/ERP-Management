const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const ActivityLog = require('../models/ActivityLog');
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
    expenseAgg,
    inventoryAgg,
    recentActivity,
  ] = await Promise.all([
    Product.countDocuments(req.user.role !== 'Admin' ? { createdBy: req.user._id } : {}),
    Customer.countDocuments(),
    SalesOrder.countDocuments(),
    PurchaseOrder.countDocuments(),
    Product.countDocuments({
      $expr: { $lte: ['$stock', '$reorderLevel'] },
      ...(req.user.role !== 'Admin' ? { createdBy: req.user._id } : {}),
    }),
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
    Expense.aggregate([
      { $match: { status: { $ne: 'Rejected' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Product.aggregate([
      ...(req.user.role !== 'Admin' ? [{ $match: { createdBy: req.user._id } }] : []),
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$stock'] } } } },
    ]),
    ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('userName action entity description createdAt')
      .lean(),
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
        totalExpenses: expenseAgg?.[0]?.total || 0,
        inventoryValue: inventoryAgg?.[0]?.totalValue || 0,
        profit: totalRevenue - (expenseAgg?.[0]?.total || 0),
      },
      monthlyRevenue,
      salesStatusDistribution: salesStatusDist,
      recentSalesOrders,
      recentPurchaseOrders,
      recentActivity,
    },
  });
});
