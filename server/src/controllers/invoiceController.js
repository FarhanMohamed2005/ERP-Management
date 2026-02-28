const Invoice = require('../models/Invoice');
const SalesOrder = require('../models/SalesOrder');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

exports.getInvoices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status || '';

  const query = {};
  if (status) query.status = status;

  const total = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .populate('customer', 'name email company')
    .populate('salesOrder', 'orderNumber')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, data: invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'name email company phone address')
    .populate('salesOrder', 'orderNumber');
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  res.json({ success: true, data: invoice });
});

exports.createInvoice = asyncHandler(async (req, res) => {
  const { salesOrder: soId, tax, dueDate, notes } = req.body;

  const so = await SalesOrder.findById(soId).populate('customer');
  if (!so) throw new ApiError(404, 'Sales order not found');

  // Build invoice items from sales order
  const items = so.items.map((item) => ({
    productTitle: item.productTitle,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = tax || so.tax || 0;

  const invoice = new Invoice({
    salesOrder: so._id,
    customer: so.customer._id,
    items,
    subtotal,
    tax: taxAmount,
    total: subtotal + taxAmount,
    dueDate,
    notes,
  });

  await invoice.save();

  const populated = await Invoice.findById(invoice._id)
    .populate('customer', 'name email company')
    .populate('salesOrder', 'orderNumber');

  logActivity({ user: req.user, action: 'create', entity: 'Invoice', entityId: invoice._id, description: `Created invoice "${invoice.invoiceNumber}"` });
  res.status(201).json({ success: true, message: 'Invoice created successfully', data: populated });
});

exports.updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  const oldStatus = invoice.status;

  if (req.body.status === 'Paid' && invoice.status !== 'Paid') {
    req.body.paidDate = new Date();
  }

  Object.assign(invoice, req.body);
  await invoice.save();

  const populated = await Invoice.findById(invoice._id)
    .populate('customer', 'name email company')
    .populate('salesOrder', 'orderNumber');

  if (req.body.status && req.body.status !== oldStatus) {
    logActivity({ user: req.user, action: 'status_change', entity: 'Invoice', entityId: invoice._id, description: `Changed invoice "${invoice.invoiceNumber}" status from "${oldStatus}" to "${invoice.status}"` });
  } else {
    logActivity({ user: req.user, action: 'update', entity: 'Invoice', entityId: invoice._id, description: `Updated invoice "${invoice.invoiceNumber}"` });
  }
  res.json({ success: true, message: 'Invoice updated successfully', data: populated });
});

exports.deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (!['Unpaid', 'Cancelled'].includes(invoice.status)) {
    throw new ApiError(400, 'Only unpaid or cancelled invoices can be deleted');
  }
  await Invoice.findByIdAndDelete(req.params.id);
  logActivity({ user: req.user, action: 'delete', entity: 'Invoice', entityId: invoice._id, description: `Deleted invoice "${invoice.invoiceNumber}"` });
  res.json({ success: true, message: 'Invoice deleted successfully' });
});
