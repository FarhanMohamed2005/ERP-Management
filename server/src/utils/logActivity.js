const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ user, action, entity, entityId, description }) => {
  try {
    await ActivityLog.create({
      user: user._id || user.id,
      userName: user.name,
      action,
      entity,
      entityId,
      description,
    });
  } catch (err) {
    // Logging should never break the main flow
    console.error('Activity log error:', err.message);
  }
};

module.exports = logActivity;
