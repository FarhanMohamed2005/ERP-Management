const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const category = req.query.category || '';
  const lowStock = req.query.lowStock === 'true';

  const query = {};

  // Non-admin users only see their own products
  if (req.user.role !== 'Admin') {
    query.createdBy = req.user._id;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (lowStock) {
    query.$expr = { $lte: ['$stock', '$reorderLevel'] };
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// GET /api/products/all — No pagination, for dropdowns
exports.getAllProducts = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.user.role !== 'Admin') {
    filter.createdBy = req.user._id;
  }
  const products = await Product.find(filter)
    .select('title sku price stock unit createdBy')
    .populate('createdBy', 'name')
    .sort({ title: 1 });
  res.json({ success: true, data: products });
});

// GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  if (req.user.role !== 'Admin' && product.createdBy?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to view this product');
  }
  res.json({ success: true, data: product });
});

// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  logActivity({ user: req.user, action: 'create', entity: 'Product', entityId: product._id, description: `Created product "${product.title}"` });
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

// PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  if (req.user.role !== 'Admin' && product.createdBy?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only update your own products');
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  logActivity({ user: req.user, action: 'update', entity: 'Product', entityId: product._id, description: `Updated product "${product.title}"` });
  res.json({ success: true, message: 'Product updated successfully', data: product });
});

// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  if (req.user.role !== 'Admin' && product.createdBy?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own products');
  }
  await Product.findByIdAndDelete(req.params.id);
  logActivity({ user: req.user, action: 'delete', entity: 'Product', entityId: product._id, description: `Deleted product "${product.title}"` });
  res.json({ success: true, message: 'Product deleted successfully' });
});

// POST /api/products/import — Bulk import products from CSV data
exports.importProducts = asyncHandler(async (req, res) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    throw new ApiError(400, 'No data provided for import');
  }

  const results = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.title || !row.sku) {
        results.errors.push({ row: i + 1, message: 'Missing required fields (title, sku)' });
        results.skipped++;
        continue;
      }

      const existing = await Product.findOne({ sku: row.sku.toUpperCase() });
      if (existing) {
        results.errors.push({ row: i + 1, message: `SKU "${row.sku}" already exists` });
        results.skipped++;
        continue;
      }

      await Product.create({
        title: row.title,
        sku: row.sku,
        description: row.description || '',
        category: row.category || 'General',
        price: Number(row.price) || 0,
        stock: Number(row.stock) || 0,
        reorderLevel: Number(row.reorderLevel) || 10,
        unit: row.unit || 'pcs',
        createdBy: req.user._id,
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: i + 1, message: err.message });
      results.skipped++;
    }
  }

  logActivity({ user: req.user, action: 'create', entity: 'Product', description: `Bulk imported ${results.created} products` });
  res.status(201).json({ success: true, message: `Imported ${results.created} products, ${results.skipped} skipped`, data: results });
});
