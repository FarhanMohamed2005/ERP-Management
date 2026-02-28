const PurchaseOrder = require('../models/PurchaseOrder');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

exports.getPurchaseOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const status = req.query.status || '';

  const query = {};
  if (search) {
    query.$or = [{ orderNumber: { $regex: search, $options: 'i' } }];
  }
  if (status) query.status = status;

  const total = await PurchaseOrder.countDocuments(query);
  const orders = await PurchaseOrder.find(query)
    .populate('supplier', 'name email company')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getPurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id)
    .populate('supplier', 'name email company phone address')
    .populate('items.product', 'title sku price stock');
  if (!order) throw new ApiError(404, 'Purchase order not found');
  res.json({ success: true, data: order });
});

exports.createPurchaseOrder = asyncHandler(async (req, res) => {
  const order = new PurchaseOrder(req.body);
  await order.save();

  const populated = await PurchaseOrder.findById(order._id).populate('supplier', 'name email company');
  logActivity({ user: req.user, action: 'create', entity: 'PurchaseOrder', entityId: order._id, description: `Created purchase order "${order.orderNumber}"` });
  res.status(201).json({ success: true, message: 'Purchase order created successfully', data: populated });
});

exports.updatePurchaseOrder = asyncHandler(async (req, res) => {
  const existing = await PurchaseOrder.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Purchase order not found');
  const oldStatus = existing.status;

  const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('supplier', 'name email company');
  if (req.body.status && req.body.status !== oldStatus) {
    logActivity({ user: req.user, action: 'status_change', entity: 'PurchaseOrder', entityId: order._id, description: `Changed purchase order "${order.orderNumber}" status from "${oldStatus}" to "${order.status}"` });
  } else {
    logActivity({ user: req.user, action: 'update', entity: 'PurchaseOrder', entityId: order._id, description: `Updated purchase order "${order.orderNumber}"` });
  }
  res.json({ success: true, message: 'Purchase order updated successfully', data: order });
});

exports.deletePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Purchase order not found');
  if (!['Draft', 'Cancelled'].includes(order.status)) {
    throw new ApiError(400, 'Only draft or cancelled orders can be deleted');
  }
  await PurchaseOrder.findByIdAndDelete(req.params.id);
  logActivity({ user: req.user, action: 'delete', entity: 'PurchaseOrder', entityId: order._id, description: `Deleted purchase order "${order.orderNumber}"` });
  res.json({ success: true, message: 'Purchase order deleted successfully' });
});
