const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const asyncHandler = require('../utils/asyncHandler');

// ──────────── AI BUSINESS INSIGHTS ────────────
exports.getInsights = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Revenue this month vs last month
  const [thisMonthRev] = await SalesOrder.aggregate([
    { $match: { createdAt: { $gte: thisMonth }, status: { $nin: ['Cancelled'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
  ]);
  const [lastMonthRev] = await SalesOrder.aggregate([
    { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, status: { $nin: ['Cancelled'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
  ]);

  const currentRev = thisMonthRev?.total || 0;
  const previousRev = lastMonthRev?.total || 0;
  const revChange = previousRev > 0 ? Math.round(((currentRev - previousRev) / previousRev) * 100) : currentRev > 0 ? 100 : 0;

  // Top products by sales quantity
  const topProducts = await SalesOrder.aggregate([
    { $match: { status: { $nin: ['Cancelled'] } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' }, name: { $first: '$items.productTitle' } } },
    { $sort: { totalRev: -1 } },
    { $limit: 5 },
  ]);

  // Top customers by order value
  const topCustomers = await SalesOrder.aggregate([
    { $match: { status: { $nin: ['Cancelled'] } } },
    { $group: { _id: '$customer', totalSpent: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'info' } },
    { $unwind: '$info' },
    { $project: { name: '$info.name', email: '$info.email', totalSpent: 1, orderCount: 1 } },
  ]);

  // Low stock products
  const lowStock = await Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
    .select('title sku stock lowStockThreshold')
    .sort({ stock: 1 })
    .limit(10);

  // Overdue invoices
  const overdueInvoices = await Invoice.countDocuments({
    status: { $in: ['Unpaid', 'Overdue'] },
    dueDate: { $lt: now },
  });

  // Expense trend
  let expenseData = [];
  try {
    expenseData = await Expense.aggregate([
      { $match: { date: { $gte: lastMonth }, status: { $ne: 'Rejected' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
  } catch (e) { /* Expense model may not exist yet */ }
  const recentExpenses = expenseData[0]?.total || 0;

  // Generate natural language insights
  const insights = [];

  if (revChange > 0) {
    insights.push({ type: 'positive', title: 'Revenue Growing', message: `Revenue is up ${revChange}% compared to last month ($${currentRev.toLocaleString()} vs $${previousRev.toLocaleString()}).` });
  } else if (revChange < 0) {
    insights.push({ type: 'warning', title: 'Revenue Declining', message: `Revenue is down ${Math.abs(revChange)}% compared to last month ($${currentRev.toLocaleString()} vs $${previousRev.toLocaleString()}).` });
  } else if (currentRev === 0 && previousRev === 0) {
    insights.push({ type: 'info', title: 'No Sales Data', message: 'Start creating sales orders to see revenue insights here.' });
  }

  if (topProducts.length > 0) {
    insights.push({ type: 'info', title: 'Best Seller', message: `"${topProducts[0].name}" is your top product with $${topProducts[0].totalRev.toLocaleString()} in revenue.` });
  }

  if (lowStock.length > 0) {
    insights.push({ type: 'warning', title: 'Stock Alert', message: `${lowStock.length} product${lowStock.length > 1 ? 's are' : ' is'} at or below reorder level. Consider restocking soon.` });
  }

  if (overdueInvoices > 0) {
    insights.push({ type: 'critical', title: 'Overdue Payments', message: `You have ${overdueInvoices} overdue invoice${overdueInvoices > 1 ? 's' : ''}. Follow up to improve cash flow.` });
  }

  if (topCustomers.length > 0) {
    insights.push({ type: 'positive', title: 'Top Customer', message: `${topCustomers[0].name} is your highest-value customer with $${topCustomers[0].totalSpent.toLocaleString()} across ${topCustomers[0].orderCount} orders.` });
  }

  if (recentExpenses > 0) {
    insights.push({ type: 'info', title: 'Recent Expenses', message: `$${recentExpenses.toLocaleString()} in expenses recorded in the last 30 days.` });
  }

  res.json({
    success: true,
    data: {
      insights,
      metrics: { currentRevenue: currentRev, previousRevenue: previousRev, revenueChange: revChange, overdueInvoices, lowStockCount: lowStock.length, recentExpenses },
      topProducts,
      topCustomers,
      lowStock,
    },
  });
});

// ──────────── SMART CHATBOT ────────────
exports.chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ success: true, data: { reply: 'Please ask me a question about your business data.' } });

  const msg = message.toLowerCase().trim();
  let reply = '';

  try {
    // Revenue queries
    if (msg.includes('revenue') || msg.includes('sales total') || msg.includes('how much')) {
      if (msg.includes('today')) {
        const start = new Date(); start.setHours(0,0,0,0);
        const [result] = await SalesOrder.aggregate([
          { $match: { createdAt: { $gte: start }, status: { $nin: ['Cancelled'] } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
        ]);
        reply = result ? `Today's revenue: $${result.total.toLocaleString()} from ${result.count} order(s).` : 'No sales recorded today.';
      } else if (msg.includes('month') || msg.includes('this month')) {
        const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
        const [result] = await SalesOrder.aggregate([
          { $match: { createdAt: { $gte: start }, status: { $nin: ['Cancelled'] } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
        ]);
        reply = result ? `This month's revenue: $${result.total.toLocaleString()} from ${result.count} order(s).` : 'No sales this month yet.';
      } else {
        const [result] = await SalesOrder.aggregate([
          { $match: { status: { $nin: ['Cancelled'] } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
        ]);
        reply = result ? `Total all-time revenue: $${result.total.toLocaleString()} from ${result.count} order(s).` : 'No sales data found.';
      }
    }
    // Products
    else if (msg.includes('how many products') || msg.includes('total products') || msg.includes('product count')) {
      const count = await Product.countDocuments();
      reply = `You have ${count} product(s) in the system.`;
    }
    else if (msg.includes('low stock') || msg.includes('out of stock') || msg.includes('restock') || msg.includes('reorder')) {
      const products = await Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).select('title stock lowStockThreshold').sort({ stock: 1 }).limit(10);
      if (products.length === 0) {
        reply = 'All products are well-stocked. No reorder needed.';
      } else {
        reply = `${products.length} product(s) need restocking:\n` + products.map(p => `• ${p.title}: ${p.stock} left (threshold: ${p.lowStockThreshold})`).join('\n');
      }
    }
    // Top/best products
    else if (msg.includes('top product') || msg.includes('best sell') || msg.includes('best product') || msg.includes('popular product')) {
      const top = await SalesOrder.aggregate([
        { $match: { status: { $nin: ['Cancelled'] } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalQty: { $sum: '$items.quantity' }, totalRev: { $sum: '$items.total' }, name: { $first: '$items.productTitle' } } },
        { $sort: { totalRev: -1 } },
        { $limit: 5 },
      ]);
      if (top.length === 0) {
        reply = 'No sales data yet to determine top products.';
      } else {
        reply = 'Top products by revenue:\n' + top.map((p, i) => `${i+1}. ${p.name}: $${p.totalRev.toLocaleString()} (${p.totalQty} sold)`).join('\n');
      }
    }
    // Customers
    else if (msg.includes('how many customer') || msg.includes('total customer') || msg.includes('customer count')) {
      const count = await Customer.countDocuments();
      reply = `You have ${count} customer(s) in the system.`;
    }
    else if (msg.includes('top customer') || msg.includes('best customer') || msg.includes('biggest customer')) {
      const top = await SalesOrder.aggregate([
        { $match: { status: { $nin: ['Cancelled'] } } },
        { $group: { _id: '$customer', totalSpent: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'info' } },
        { $unwind: '$info' },
        { $project: { name: '$info.name', totalSpent: 1, orderCount: 1 } },
      ]);
      if (top.length === 0) {
        reply = 'No customer purchase data available yet.';
      } else {
        reply = 'Top customers by spending:\n' + top.map((c, i) => `${i+1}. ${c.name}: $${c.totalSpent.toLocaleString()} (${c.orderCount} orders)`).join('\n');
      }
    }
    // Suppliers
    else if (msg.includes('how many supplier') || msg.includes('total supplier') || msg.includes('supplier count')) {
      const count = await Supplier.countDocuments();
      reply = `You have ${count} supplier(s) in the system.`;
    }
    // Invoices
    else if (msg.includes('overdue') || msg.includes('unpaid invoice') || msg.includes('pending invoice') || msg.includes('outstanding')) {
      const overdue = await Invoice.find({ status: { $in: ['Unpaid', 'Overdue'] } })
        .populate('customer', 'name')
        .sort({ dueDate: 1 })
        .limit(10);
      if (overdue.length === 0) {
        reply = 'No overdue or unpaid invoices. All payments are up to date!';
      } else {
        const total = overdue.reduce((s, i) => s + (i.totalAmount || i.totalPrice || 0), 0);
        reply = `${overdue.length} unpaid/overdue invoice(s) totaling $${total.toLocaleString()}:\n` + overdue.map(i => `• ${i.invoiceNumber}: $${(i.totalAmount || i.totalPrice || 0).toLocaleString()} - ${i.customer?.name || 'Unknown'}`).join('\n');
      }
    }
    // Orders
    else if (msg.includes('pending order') || msg.includes('draft order') || msg.includes('open order')) {
      const drafts = await SalesOrder.countDocuments({ status: 'Draft' });
      const confirmed = await SalesOrder.countDocuments({ status: 'Confirmed' });
      const shipped = await SalesOrder.countDocuments({ status: 'Shipped' });
      reply = `Order status breakdown:\n• Draft: ${drafts}\n• Confirmed: ${confirmed}\n• Shipped: ${shipped}`;
    }
    else if (msg.includes('how many order') || msg.includes('total order') || msg.includes('order count')) {
      const sales = await SalesOrder.countDocuments();
      const purchase = await PurchaseOrder.countDocuments();
      reply = `Total orders: ${sales} sales order(s) and ${purchase} purchase order(s).`;
    }
    // Expenses
    else if (msg.includes('expense') || msg.includes('spending') || msg.includes('cost')) {
      try {
        const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
        const [result] = await Expense.aggregate([
          { $match: { date: { $gte: thisMonth }, status: { $ne: 'Rejected' } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]);
        reply = result ? `This month's expenses: $${result.total.toLocaleString()} across ${result.count} entries.` : 'No expenses recorded this month.';
      } catch (e) {
        reply = 'Expense tracking is available. Start recording expenses to see data here.';
      }
    }
    // Summary / overview
    else if (msg.includes('summary') || msg.includes('overview') || msg.includes('how is business') || msg.includes('status')) {
      const products = await Product.countDocuments();
      const customers = await Customer.countDocuments();
      const salesOrders = await SalesOrder.countDocuments();
      const [rev] = await SalesOrder.aggregate([
        { $match: { status: { $nin: ['Cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]);
      const lowStock = await Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } });
      reply = `Business Overview:\n• Products: ${products}\n• Customers: ${customers}\n• Sales Orders: ${salesOrders}\n• Total Revenue: $${(rev?.total || 0).toLocaleString()}\n• Low Stock Items: ${lowStock}`;
    }
    // Help
    else if (msg.includes('help') || msg.includes('what can you') || msg.includes('what do you')) {
      reply = `I can help you with:\n• Revenue queries ("What's this month's revenue?")\n• Product info ("How many products?", "Low stock items")\n• Top products/customers ("Top selling products")\n• Invoice status ("Overdue invoices")\n• Order counts ("How many orders?")\n• Expense tracking ("Monthly expenses")\n• Business summary ("Give me an overview")`;
    }
    // Default
    else {
      reply = `I'm not sure how to answer that. Try asking about:\n• Revenue (today/this month/total)\n• Products (count, low stock, top selling)\n• Customers (count, top customers)\n• Orders (count, pending, status)\n• Invoices (overdue, unpaid)\n• Expenses (monthly spending)\n• Business summary/overview\n\nOr type "help" for the full list.`;
    }
  } catch (err) {
    reply = 'Sorry, I encountered an error processing your query. Please try again.';
  }

  res.json({ success: true, data: { reply } });
});

// ──────────── SMART REORDER SUGGESTIONS ────────────
exports.getReorderSuggestions = asyncHandler(async (req, res) => {
  // Get products at or below reorder level
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  }).select('title sku stock lowStockThreshold price category');

  // For each low stock product, calculate average monthly consumption
  const suggestions = [];
  for (const product of lowStockProducts) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesData = await SalesOrder.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $nin: ['Cancelled'] } } },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      { $group: { _id: null, totalSold: { $sum: '$items.quantity' }, orderCount: { $sum: 1 } } },
    ]);

    const totalSold = salesData[0]?.totalSold || 0;
    const avgMonthly = Math.ceil(totalSold / 6);
    const daysOfStock = avgMonthly > 0 ? Math.floor((product.stock / avgMonthly) * 30) : product.stock > 0 ? 999 : 0;
    const suggestedQty = Math.max(avgMonthly * 2, product.lowStockThreshold * 2) - product.stock;

    // Find preferred supplier (from recent purchase orders)
    const recentPO = await PurchaseOrder.findOne({ 'items.product': product._id })
      .populate('supplier', 'name')
      .sort({ createdAt: -1 });

    suggestions.push({
      product: { _id: product._id, title: product.title, sku: product.sku, category: product.category },
      currentStock: product.stock,
      threshold: product.lowStockThreshold,
      avgMonthlySales: avgMonthly,
      daysOfStockLeft: daysOfStock,
      suggestedOrderQty: Math.max(suggestedQty, 1),
      estimatedCost: Math.max(suggestedQty, 1) * product.price,
      urgency: daysOfStock <= 7 ? 'Critical' : daysOfStock <= 14 ? 'High' : daysOfStock <= 30 ? 'Medium' : 'Low',
      preferredSupplier: recentPO?.supplier?.name || 'Not assigned',
    });
  }

  // Sort by urgency
  const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  suggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  res.json({ success: true, data: suggestions });
});

// ──────────── ANOMALY DETECTION ────────────
exports.getAnomalies = asyncHandler(async (req, res) => {
  const anomalies = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // 1. Unusual order values (orders > 2x average)
  const [avgOrder] = await SalesOrder.aggregate([
    { $match: { status: { $nin: ['Cancelled'] } } },
    { $group: { _id: null, avg: { $avg: '$totalPrice' }, stdDev: { $stdDevPop: '$totalPrice' } } },
  ]);
  if (avgOrder && avgOrder.avg > 0) {
    const threshold = avgOrder.avg + (avgOrder.stdDev || avgOrder.avg) * 2;
    const unusual = await SalesOrder.find({
      totalPrice: { $gte: threshold },
      createdAt: { $gte: thirtyDaysAgo },
      status: { $nin: ['Cancelled'] },
    }).populate('customer', 'name').limit(5);
    for (const order of unusual) {
      anomalies.push({
        type: 'unusual_order',
        severity: 'medium',
        title: 'Unusually Large Order',
        message: `Order ${order.orderNumber} ($${order.totalPrice.toLocaleString()}) is significantly above average ($${Math.round(avgOrder.avg).toLocaleString()}).`,
        entity: 'SalesOrder',
        entityId: order._id,
        date: order.createdAt,
      });
    }
  }

  // 2. Sudden sales drop (this month < 50% of last month)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [thisMonthSales] = await SalesOrder.aggregate([
    { $match: { createdAt: { $gte: thisMonthStart }, status: { $nin: ['Cancelled'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
  ]);
  const [lastMonthSales] = await SalesOrder.aggregate([
    { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: { $nin: ['Cancelled'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
  ]);

  if (lastMonthSales && lastMonthSales.total > 0 && thisMonthSales) {
    const ratio = thisMonthSales.total / lastMonthSales.total;
    if (ratio < 0.5) {
      anomalies.push({
        type: 'sales_drop',
        severity: 'high',
        title: 'Significant Sales Drop',
        message: `This month's sales ($${thisMonthSales.total.toLocaleString()}) are ${Math.round((1 - ratio) * 100)}% lower than last month ($${lastMonthSales.total.toLocaleString()}).`,
        date: now,
      });
    }
  }

  // 3. Products with zero sales in 30 days but had sales before
  const recentlySold = await SalesOrder.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $nin: ['Cancelled'] } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product' } },
  ]);
  const recentIds = recentlySold.map(p => p._id);

  const previouslySold = await SalesOrder.aggregate([
    { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, status: { $nin: ['Cancelled'] } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', name: { $first: '$items.productTitle' }, qty: { $sum: '$items.quantity' } } },
  ]);

  for (const product of previouslySold) {
    if (!recentIds.some(id => id.toString() === product._id.toString())) {
      anomalies.push({
        type: 'stalled_product',
        severity: 'low',
        title: 'Product Sales Stalled',
        message: `"${product.name}" sold ${product.qty} units last month but has zero sales this month.`,
        entity: 'Product',
        entityId: product._id,
        date: now,
      });
    }
  }

  // 4. High discount orders
  const highDiscount = await SalesOrder.find({
    createdAt: { $gte: thirtyDaysAgo },
    discountType: { $ne: 'none' },
    $expr: { $gte: ['$discountAmount', { $multiply: ['$subtotal', 0.2] }] },
  }).populate('customer', 'name').limit(5);

  for (const order of highDiscount) {
    const pct = Math.round((order.discountAmount / order.subtotal) * 100);
    anomalies.push({
      type: 'high_discount',
      severity: 'medium',
      title: 'High Discount Applied',
      message: `Order ${order.orderNumber} has a ${pct}% discount ($${order.discountAmount.toLocaleString()} off).`,
      entity: 'SalesOrder',
      entityId: order._id,
      date: order.createdAt,
    });
  }

  // Sort by severity
  const sevOrder = { high: 0, medium: 1, low: 2 };
  anomalies.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  res.json({ success: true, data: anomalies });
});
