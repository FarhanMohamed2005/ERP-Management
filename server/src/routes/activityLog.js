const router = require('express').Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', getActivityLogs);

module.exports = router;
