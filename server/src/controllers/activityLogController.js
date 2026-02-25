const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/activity-log
exports.getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, entity, action } = req.query;
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;

  const total = await ActivityLog.countDocuments(filter);
  const logs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  res.json({
    success: true,
    data: logs,
    total,
    page: Number(page),
    limit: Number(limit),
  });
});
