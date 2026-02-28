const SalesOrder = require('../models/SalesOrder');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

exports.getSalesOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const status = req.query.status || '';

  const query = {};
  if (search) {
    query.$or = [{ orderNumber: { $regex: search, $options: 'i' } }];
  }
  if (status) query.status = status;

  const total = await SalesOrder.countDocuments(query);
  const orders = await SalesOrder.find(query)
    .populate('customer', 'name email company')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getSalesOrder = asyncHandler(async (req, res) => {
  const order = await SalesOrder.findById(req.params.id)
    .populate('customer', 'name email company phone address')
    .populate('items.product', 'title sku price');
  if (!order) throw new ApiError(404, 'Sales order not found');
  res.json({ success: true, data: order });
});

exports.createSalesOrder = asyncHandler(async (req, res) => {
  const order = new SalesOrder(req.body);
  await order.save();

  const populated = await SalesOrder.findById(order._id).populate('customer', 'name email company');
  logActivity({ user: req.user, action: 'create', entity: 'SalesOrder', entityId: order._id, description: `Created sales order "${order.orderNumber}"` });
  res.status(201).json({ success: true, message: 'Sales order created successfully', data: populated });
});

exports.updateSalesOrder = asyncHandler(async (req, res) => {
  const order = await SalesOrder.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Sales order not found');
  const oldStatus = order.status;

  // If confirming order, deduct stock
  if (req.body.status === 'Confirmed' && order.status === 'Draft') {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.stock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for ${product.title}. Available: ${product.stock}`);
        }
        product.stock -= item.quantity;
        await product.save();
      }
    }
  }

  // If cancelling a confirmed order, restore stock
  if (req.body.status === 'Cancelled' && ['Confirmed', 'Shipped'].includes(order.status)) {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }
  }

  Object.assign(order, req.body);
  await order.save();

  const populated = await SalesOrder.findById(order._id).populate('customer', 'name email company');
  if (req.body.status && req.body.status !== oldStatus) {
    logActivity({ user: req.user, action: 'status_change', entity: 'SalesOrder', entityId: order._id, description: `Changed sales order "${order.orderNumber}" status from "${oldStatus}" to "${order.status}"` });
  } else {
    logActivity({ user: req.user, action: 'update', entity: 'SalesOrder', entityId: order._id, description: `Updated sales order "${order.orderNumber}"` });
  }
  res.json({ success: true, message: 'Sales order updated successfully', data: populated });
});

exports.deleteSalesOrder = asyncHandler(async (req, res) => {
  const order = await SalesOrder.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Sales order not found');
  if (!['Draft', 'Cancelled'].includes(order.status)) {
    throw new ApiError(400, 'Only draft or cancelled orders can be deleted');
  }
  await SalesOrder.findByIdAndDelete(req.params.id);
  logActivity({ user: req.user, action: 'delete', entity: 'SalesOrder', entityId: order._id, description: `Deleted sales order "${order.orderNumber}"` });
  res.json({ success: true, message: 'Sales order deleted successfully' });
});
