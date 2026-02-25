const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Invoice = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reports/sales-summary
exports.salesSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { status: { $ne: 'Cancelled' } };

  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const [summary, topProducts, topCustomers, monthlyTrend] = await Promise.all([
    // Overall totals
    SalesOrder.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
    ]),
    // Top 10 selling products
    SalesOrder.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productTitle: { $first: '$items.productTitle' },
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]),
    // Top 10 customers by revenue
    SalesOrder.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo',
        },
      },
      { $unwind: '$customerInfo' },
      {
        $project: {
          name: '$customerInfo.name',
          company: '$customerInfo.company',
          totalOrders: 1,
          totalSpent: 1,
        },
      },
    ]),
    // Monthly trend (last 12 months)
    SalesOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
          status: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      summary: summary[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
      topProducts,
      topCustomers,
      monthlyTrend,
    },
  });
});

// GET /api/reports/purchase-summary
exports.purchaseSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { status: { $ne: 'Cancelled' } };

  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const [summary, topSuppliers, monthlyTrend] = await Promise.all([
    PurchaseOrder.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalCost: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
    ]),
    PurchaseOrder.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$supplier',
          totalOrders: { $sum: 1 },
          totalCost: { $sum: '$totalPrice' },
        },
      },
      { $sort: { totalCost: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplierInfo',
        },
      },
      { $unwind: '$supplierInfo' },
      {
        $project: {
          name: '$supplierInfo.name',
          company: '$supplierInfo.company',
          totalOrders: 1,
          totalCost: 1,
        },
      },
    ]),
    PurchaseOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
          status: { $ne: 'Cancelled' },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          cost: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      summary: summary[0] || { totalOrders: 0, totalCost: 0, avgOrderValue: 0 },
      topSuppliers,
      monthlyTrend,
    },
  });
});

// GET /api/reports/inventory
exports.inventoryReport = asyncHandler(async (req, res) => {
  const [products, categoryBreakdown, lowStockItems] = await Promise.all([
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
          avgPrice: { $avg: '$price' },
        },
      },
    ]),
    Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
        },
      },
      { $sort: { totalValue: -1 } },
    ]),
    Product.find({ $expr: { $lte: ['$stock', '$reorderLevel'] } })
      .select('title sku stock reorderLevel price category')
      .sort({ stock: 1 })
      .limit(20),
  ]);

  res.json({
    success: true,
    data: {
      summary: products[0] || { totalProducts: 0, totalStock: 0, totalValue: 0, avgPrice: 0 },
      categoryBreakdown,
      lowStockItems,
    },
  });
});

// GET /api/reports/invoice-summary
exports.invoiceSummary = asyncHandler(async (req, res) => {
  const [statusBreakdown, overdue, recentPaid] = await Promise.all([
    Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
        },
      },
    ]),
    Invoice.find({ status: 'Unpaid', dueDate: { $lt: new Date() } })
      .populate('customer', 'name company')
      .select('invoiceNumber customer total dueDate')
      .sort({ dueDate: 1 })
      .limit(10),
    Invoice.find({ status: 'Paid' })
      .populate('customer', 'name company')
      .select('invoiceNumber customer total updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10),
  ]);

  res.json({
    success: true,
    data: {
      statusBreakdown,
      overdue,
      recentPaid,
    },
  });
});
