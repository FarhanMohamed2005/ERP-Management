const CreditNote = require('../models/CreditNote');
const SalesOrder = require('../models/SalesOrder');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// ---------------------------------------------------------------------------
// GET /api/credit-notes  — list with pagination
// ---------------------------------------------------------------------------
exports.getCreditNotes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status || '';

  const query = {};
  if (status) query.status = status;

  const total = await CreditNote.countDocuments(query);
  const creditNotes = await CreditNote.find(query)
    .populate('customer', 'name email company')
    .populate('salesOrder', 'orderNumber')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    data: creditNotes,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ---------------------------------------------------------------------------
// GET /api/credit-notes/:id  — single with populate
// ---------------------------------------------------------------------------
exports.getCreditNote = asyncHandler(async (req, res) => {
  const creditNote = await CreditNote.findById(req.params.id)
    .populate('customer', 'name email company phone address')
    .populate('salesOrder', 'orderNumber');
  if (!creditNote) throw new ApiError(404, 'Credit note not found');
  res.json({ success: true, data: creditNote });
});

// ---------------------------------------------------------------------------
// POST /api/credit-notes  — create from a sales order reference
// ---------------------------------------------------------------------------
exports.createCreditNote = asyncHandler(async (req, res) => {
  const { salesOrder: soId, items, reason, tax, notes } = req.body;

  const so = await SalesOrder.findById(soId).populate('customer');
  if (!so) throw new ApiError(404, 'Sales order not found');

  // Build credit note items — use provided items (partial return) or fall back to SO items
  const cnItems = (items && items.length > 0 ? items : so.items).map((item) => ({
    productTitle: item.productTitle,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.quantity * item.unitPrice,
  }));

  const creditNote = new CreditNote({
    salesOrder: so._id,
    customer: so.customer._id,
    items: cnItems,
    reason,
    tax: tax || 0,
    notes: notes || '',
  });

  await creditNote.save();

  const populated = await CreditNote.findById(creditNote._id)
    .populate('customer', 'name email company')
    .populate('salesOrder', 'orderNumber');

  logActivity({
    user: req.user,
    action: 'create',
    entity: 'CreditNote',
    entityId: creditNote._id,
    description: `Created credit note "${creditNote.creditNoteNumber}" for SO "${so.orderNumber}"`,
  });

  res.status(201).json({
    success: true,
    message: 'Credit note created successfully',
    data: populated,
  });
});

// ---------------------------------------------------------------------------
// PUT /api/credit-notes/:id  — update (status transitions + fields)
// ---------------------------------------------------------------------------
exports.updateCreditNote = asyncHandler(async (req, res) => {
  const creditNote = await CreditNote.findById(req.params.id);
  if (!creditNote) throw new ApiError(404, 'Credit note not found');

  const oldStatus = creditNote.status;

  // Validate status transitions when a status change is requested
  if (req.body.status && req.body.status !== oldStatus) {
    const allowed = {
      Draft: ['Approved', 'Cancelled'],
      Approved: ['Refunded', 'Cancelled'],
    };

    const validNext = allowed[oldStatus] || [];
    if (!validNext.includes(req.body.status)) {
      throw new ApiError(
        400,
        `Cannot change status from "${oldStatus}" to "${req.body.status}"`
      );
    }
  }

  Object.assign(creditNote, req.body);
  await creditNote.save();

  const populated = await CreditNote.findById(creditNote._id)
    .populate('customer', 'name email company')
    .populate('salesOrder', 'orderNumber');

  if (req.body.status && req.body.status !== oldStatus) {
    logActivity({
      user: req.user,
      action: 'status_change',
      entity: 'CreditNote',
      entityId: creditNote._id,
      description: `Changed credit note "${creditNote.creditNoteNumber}" status from "${oldStatus}" to "${creditNote.status}"`,
    });
  } else {
    logActivity({
      user: req.user,
      action: 'update',
      entity: 'CreditNote',
      entityId: creditNote._id,
      description: `Updated credit note "${creditNote.creditNoteNumber}"`,
    });
  }

  res.json({
    success: true,
    message: 'Credit note updated successfully',
    data: populated,
  });
});
