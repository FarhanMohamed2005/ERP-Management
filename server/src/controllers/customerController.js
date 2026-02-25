const Customer = require('../models/Customer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

exports.getCustomers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, data: customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({ isActive: true }).select('name email company').sort({ name: 1 });
  res.json({ success: true, data: customers });
});

exports.getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, data: customer });
});

exports.createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  logActivity({ user: req.user, action: 'create', entity: 'Customer', entityId: customer._id, description: `Created customer "${customer.name}"` });
  res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!customer) throw new ApiError(404, 'Customer not found');
  logActivity({ user: req.user, action: 'update', entity: 'Customer', entityId: customer._id, description: `Updated customer "${customer.name}"` });
  res.json({ success: true, message: 'Customer updated successfully', data: customer });
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  logActivity({ user: req.user, action: 'delete', entity: 'Customer', entityId: customer._id, description: `Deleted customer "${customer.name}"` });
  res.json({ success: true, message: 'Customer deleted successfully' });
});

// POST /api/customers/import — Bulk import customers from CSV data
exports.importCustomers = asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    throw new ApiError(400, 'No data provided for import');
  }

  const results = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.name || !row.email) {
        results.errors.push({ row: i + 1, message: 'Missing required fields (name, email)' });
        results.skipped++;
        continue;
      }

      const existing = await Customer.findOne({ email: row.email.toLowerCase() });
      if (existing) {
        results.errors.push({ row: i + 1, message: `Email "${row.email}" already exists` });
        results.skipped++;
        continue;
      }

      await Customer.create({
        name: row.name,
        email: row.email,
        phone: row.phone || '',
        company: row.company || '',
        address: row.address || '',
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: i + 1, message: err.message });
      results.skipped++;
    }
  }

  logActivity({ user: req.user, action: 'create', entity: 'Customer', description: `Bulk imported ${results.created} customers` });
  res.status(201).json({ success: true, message: `Imported ${results.created} customers, ${results.skipped} skipped`, data: results });
});
