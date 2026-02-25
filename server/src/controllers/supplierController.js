const Supplier = require('../models/Supplier');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

exports.getSuppliers = asyncHandler(async (req, res) => {
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

  const total = await Supplier.countDocuments(query);
  const suppliers = await Supplier.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, data: suppliers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getAllSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ isActive: true }).select('name email company').sort({ name: 1 });
  res.json({ success: true, data: suppliers });
});

exports.getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  res.json({ success: true, data: supplier });
});

exports.createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  logActivity({ user: req.user, action: 'create', entity: 'Supplier', entityId: supplier._id, description: `Created supplier "${supplier.name}"` });
  res.status(201).json({ success: true, message: 'Supplier created successfully', data: supplier });
});

exports.updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  logActivity({ user: req.user, action: 'update', entity: 'Supplier', entityId: supplier._id, description: `Updated supplier "${supplier.name}"` });
  res.json({ success: true, message: 'Supplier updated successfully', data: supplier });
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  logActivity({ user: req.user, action: 'delete', entity: 'Supplier', entityId: supplier._id, description: `Deleted supplier "${supplier.name}"` });
  res.json({ success: true, message: 'Supplier deleted successfully' });
});

// POST /api/suppliers/import — Bulk import suppliers from CSV data
exports.importSuppliers = asyncHandler(async (req, res) => {
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

      const existing = await Supplier.findOne({ email: row.email.toLowerCase() });
      if (existing) {
        results.errors.push({ row: i + 1, message: `Email "${row.email}" already exists` });
        results.skipped++;
        continue;
      }

      await Supplier.create({
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

  logActivity({ user: req.user, action: 'create', entity: 'Supplier', description: `Bulk imported ${results.created} suppliers` });
  res.status(201).json({ success: true, message: `Imported ${results.created} suppliers, ${results.skipped} skipped`, data: results });
});
