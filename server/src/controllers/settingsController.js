const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/settings
exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find().sort({ category: 1, key: 1 });

  // Group by category
  const grouped = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = {};
    acc[setting.category][setting.key] = setting.value;
    return acc;
  }, {});

  res.json({ success: true, data: grouped, raw: settings });
});

// PUT /api/settings
exports.updateSettings = asyncHandler(async (req, res) => {
  const updates = req.body;

  if (!updates || typeof updates !== 'object') {
    throw new ApiError(400, 'Settings data is required');
  }

  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, key },
      { upsert: true, new: true, runValidators: true }
    );
    results.push(setting);
  }

  res.json({ success: true, message: 'Settings updated successfully', data: results });
});

// POST /api/settings/init - Initialize default settings
exports.initSettings = asyncHandler(async (req, res) => {
  const defaults = [
    { key: 'companyName', value: 'ERP Management', category: 'general', description: 'Company name' },
    { key: 'companyEmail', value: '', category: 'general', description: 'Company email' },
    { key: 'companyPhone', value: '', category: 'general', description: 'Company phone' },
    { key: 'companyAddress', value: '', category: 'general', description: 'Company address' },
    { key: 'currency', value: 'USD', category: 'general', description: 'Default currency' },
    { key: 'currencySymbol', value: '$', category: 'general', description: 'Currency symbol' },
    { key: 'taxEnabled', value: true, category: 'tax', description: 'Enable tax calculation' },
    { key: 'defaultTaxRate', value: 0, category: 'tax', description: 'Default tax rate percentage' },
    { key: 'invoicePrefix', value: 'INV-', category: 'invoice', description: 'Invoice number prefix' },
    { key: 'invoiceFooter', value: 'Thank you for your business!', category: 'invoice', description: 'Invoice footer text' },
    { key: 'paymentTermsDays', value: 30, category: 'invoice', description: 'Default payment terms in days' },
    { key: 'lowStockAlert', value: true, category: 'notification', description: 'Enable low stock alerts' },
    { key: 'overdueInvoiceAlert', value: true, category: 'notification', description: 'Enable overdue invoice alerts' },
    { key: 'emailNotifications', value: true, category: 'email', description: 'Enable email notifications' },
  ];

  let created = 0;
  for (const setting of defaults) {
    const exists = await Setting.findOne({ key: setting.key });
    if (!exists) {
      await Setting.create(setting);
      created++;
    }
  }

  const settings = await Setting.find().sort({ category: 1, key: 1 });
  res.json({ success: true, message: `Initialized ${created} new settings`, data: settings });
});
