const Quotation = require('../models/Quotation');
const SalesOrder = require('../models/SalesOrder');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

exports.getQuotations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const status = req.query.status || '';

  const query = {};
  if (search) {
    query.$or = [{ quoteNumber: { $regex: search, $options: 'i' } }];
  }
  if (status) query.status = status;

  const total = await Quotation.countDocuments(query);
  const quotations = await Quotation.find(query)
    .populate('customer', 'name email company')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, data: quotations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('customer', 'name email company phone address')
    .populate('items.product', 'title sku price')
    .populate('convertedToOrder', 'orderNumber');
  if (!quotation) throw new ApiError(404, 'Quotation not found');
  res.json({ success: true, data: quotation });
});

exports.createQuotation = asyncHandler(async (req, res) => {
  const quotation = new Quotation({ ...req.body, createdBy: req.user._id });
  await quotation.save();

  const populated = await Quotation.findById(quotation._id).populate('customer', 'name email company');
  logActivity({ user: req.user, action: 'create', entity: 'Quotation', entityId: quotation._id, description: `Created quotation "${quotation.quoteNumber}"` });
  res.status(201).json({ success: true, message: 'Quotation created successfully', data: populated });
});

exports.updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new ApiError(404, 'Quotation not found');
  if (quotation.status === 'Converted') throw new ApiError(400, 'Cannot edit a converted quotation');

  Object.assign(quotation, req.body);
  await quotation.save();

  const populated = await Quotation.findById(quotation._id).populate('customer', 'name email company');
  logActivity({ user: req.user, action: 'update', entity: 'Quotation', entityId: quotation._id, description: `Updated quotation "${quotation.quoteNumber}"` });
  res.json({ success: true, message: 'Quotation updated successfully', data: populated });
});

exports.deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new ApiError(404, 'Quotation not found');
  if (quotation.status === 'Converted') throw new ApiError(400, 'Cannot delete a converted quotation');

  await quotation.deleteOne();
  logActivity({ user: req.user, action: 'delete', entity: 'Quotation', entityId: req.params.id, description: `Deleted quotation "${quotation.quoteNumber}"` });
  res.json({ success: true, message: 'Quotation deleted successfully' });
});

exports.convertToSalesOrder = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw new ApiError(404, 'Quotation not found');
  if (quotation.status === 'Converted') throw new ApiError(400, 'Quotation already converted');
  if (quotation.status === 'Rejected' || quotation.status === 'Expired') {
    throw new ApiError(400, `Cannot convert a ${quotation.status.toLowerCase()} quotation`);
  }

  const salesOrder = new SalesOrder({
    customer: quotation.customer,
    items: quotation.items,
    discountType: quotation.discountType,
    discountValue: quotation.discountValue,
    taxRate: quotation.taxRate,
    notes: `Converted from quotation ${quotation.quoteNumber}. ${quotation.notes || ''}`.trim(),
  });
  await salesOrder.save();

  quotation.status = 'Converted';
  quotation.convertedToOrder = salesOrder._id;
  await quotation.save();

  logActivity({ user: req.user, action: 'create', entity: 'SalesOrder', entityId: salesOrder._id, description: `Converted quotation "${quotation.quoteNumber}" to sales order "${salesOrder.orderNumber}"` });

  const populated = await SalesOrder.findById(salesOrder._id).populate('customer', 'name email company');
  res.status(201).json({ success: true, message: `Quotation converted to Sales Order ${salesOrder.orderNumber}`, data: populated });
});
