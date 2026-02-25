const router = require('express').Router();
const { getNotifications } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', getNotifications);

module.exports = router;
