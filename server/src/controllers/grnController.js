const GRN = require('../models/GRN');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

exports.getGRNs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const total = await GRN.countDocuments();
  const grns = await GRN.find()
    .populate('purchaseOrder', 'orderNumber')
    .populate('receivedBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, data: grns, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getGRN = asyncHandler(async (req, res) => {
  const grn = await GRN.findById(req.params.id)
    .populate('purchaseOrder')
    .populate('receivedItems.product', 'title sku')
    .populate('receivedBy', 'name');
  if (!grn) throw new ApiError(404, 'GRN not found');
  res.json({ success: true, data: grn });
});

exports.createGRN = asyncHandler(async (req, res) => {
  const { purchaseOrder: poId, receivedItems, notes } = req.body;

  const po = await PurchaseOrder.findById(poId);
  if (!po) throw new ApiError(404, 'Purchase order not found');

  if (['Received', 'Cancelled'].includes(po.status)) {
    throw new ApiError(400, `Cannot create GRN for a ${po.status.toLowerCase()} purchase order`);
  }

  const grn = new GRN({
    purchaseOrder: poId,
    receivedItems,
    receivedBy: req.user._id,
    notes,
  });

  await grn.save();

  // Update product stock for received quantities
  for (const item of receivedItems) {
    if (item.receivedQuantity > 0) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.receivedQuantity },
      });
    }
  }

  // Check if all items fully received, update PO status
  const allReceived = receivedItems.every((item) => item.receivedQuantity >= item.orderedQuantity);
  const someReceived = receivedItems.some((item) => item.receivedQuantity > 0);

  if (allReceived) {
    po.status = 'Received';
  } else if (someReceived) {
    po.status = 'Partially Received';
  }
  await po.save();

  const populated = await GRN.findById(grn._id)
    .populate('purchaseOrder', 'orderNumber')
    .populate('receivedBy', 'name');

  logActivity({ user: req.user, action: 'create', entity: 'GRN', entityId: grn._id, description: `Created GRN "${grn.grnNumber}"` });
  res.status(201).json({ success: true, message: 'Goods receipt created and stock updated', data: populated });
});

exports.deleteGRN = asyncHandler(async (req, res) => {
  const grn = await GRN.findById(req.params.id);
  if (!grn) throw new ApiError(404, 'GRN not found');
  await GRN.findByIdAndDelete(req.params.id);
  logActivity({ user: req.user, action: 'delete', entity: 'GRN', entityId: grn._id, description: `Deleted GRN "${grn.grnNumber}"` });
  res.json({ success: true, message: 'GRN deleted successfully' });
});
