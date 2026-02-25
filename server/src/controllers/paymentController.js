const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// POST /api/payments — Record a payment against an invoice
exports.createPayment = asyncHandler(async (req, res) => {
  const { invoice: invoiceId, amount, method, reference, notes } = req.body;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (invoice.status === 'Cancelled') throw new ApiError(400, 'Cannot pay a cancelled invoice');
  if (invoice.status === 'Paid') throw new ApiError(400, 'Invoice is already fully paid');

  // Calculate existing payments
  const existingPayments = await Payment.aggregate([
    { $match: { invoice: invoice._id } },
    { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
  ]);
  const totalPaid = existingPayments[0]?.totalPaid || 0;
  const remaining = invoice.total - totalPaid;

  if (amount > remaining + 0.01) {
    throw new ApiError(400, `Payment exceeds remaining balance of $${remaining.toFixed(2)}`);
  }

  const payment = await Payment.create({
    invoice: invoiceId,
    amount,
    method: method || 'Bank Transfer',
    reference,
    notes,
    recordedBy: req.user._id,
  });

  // Update invoice status
  const newTotalPaid = totalPaid + amount;
  if (newTotalPaid >= invoice.total - 0.01) {
    invoice.status = 'Paid';
    invoice.paidAmount = invoice.total;
  } else {
    invoice.status = 'Partial';
    invoice.paidAmount = newTotalPaid;
  }
  await invoice.save();

  logActivity({
    user: req.user,
    action: 'create',
    entity: 'Invoice',
    entityId: invoice._id,
    description: `Recorded payment of $${amount.toFixed(2)} on invoice ${invoice.invoiceNumber}`,
  });

  res.status(201).json({
    success: true,
    message: `Payment of $${amount.toFixed(2)} recorded successfully`,
    data: payment,
    invoiceStatus: invoice.status,
    remaining: invoice.total - newTotalPaid,
  });
});

// GET /api/payments/:invoiceId — Get all payments for an invoice
exports.getPaymentsByInvoice = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ invoice: req.params.invoiceId })
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 });

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    success: true,
    data: payments,
    totalPaid: total,
  });
});
