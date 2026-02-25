const Expense = require('../models/Expense');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

exports.getExpenses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const category = req.query.category || '';
  const status = req.query.status || '';
  const startDate = req.query.startDate || '';
  const endDate = req.query.endDate || '';

  const query = {};
  if (search) {
    query.$or = [
      { expenseNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { vendor: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) query.category = category;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const total = await Expense.countDocuments(query);
  const expenses = await Expense.find(query)
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Get summary
  const totalAmount = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  res.json({
    success: true,
    data: expenses,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    summary: { totalAmount: totalAmount[0]?.total || 0 },
  });
});

exports.getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');
  if (!expense) throw new ApiError(404, 'Expense not found');
  res.json({ success: true, data: expense });
});

exports.createExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.create({ ...req.body, createdBy: req.user._id });

  logActivity({ user: req.user, action: 'create', entity: 'Expense', entityId: expense._id, description: `Created expense "${expense.expenseNumber}" - $${expense.amount}` });
  res.status(201).json({ success: true, message: 'Expense created successfully', data: expense });
});

exports.updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new ApiError(404, 'Expense not found');

  Object.assign(expense, req.body);
  await expense.save();

  logActivity({ user: req.user, action: 'update', entity: 'Expense', entityId: expense._id, description: `Updated expense "${expense.expenseNumber}"` });
  res.json({ success: true, message: 'Expense updated successfully', data: expense });
});

exports.deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new ApiError(404, 'Expense not found');

  await expense.deleteOne();
  logActivity({ user: req.user, action: 'delete', entity: 'Expense', entityId: req.params.id, description: `Deleted expense "${expense.expenseNumber}"` });
  res.json({ success: true, message: 'Expense deleted successfully' });
});

exports.approveExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new ApiError(404, 'Expense not found');

  expense.status = req.body.status;
  if (req.body.status === 'Approved') expense.approvedBy = req.user._id;
  await expense.save();

  logActivity({ user: req.user, action: 'update', entity: 'Expense', entityId: expense._id, description: `${req.body.status} expense "${expense.expenseNumber}"` });
  res.json({ success: true, message: `Expense ${req.body.status.toLowerCase()} successfully`, data: expense });
});

exports.getExpenseSummary = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const byCategory = await Expense.aggregate([
    { $match: { date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) }, status: { $ne: 'Rejected' } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const byMonth = await Expense.aggregate([
    { $match: { date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) }, status: { $ne: 'Rejected' } } },
    { $group: { _id: { month: { $month: '$date' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { '_id.month': 1 } },
  ]);

  const grandTotal = byCategory.reduce((sum, c) => sum + c.total, 0);

  res.json({ success: true, data: { byCategory, byMonth, grandTotal, year } });
});
