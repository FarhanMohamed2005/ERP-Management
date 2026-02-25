const router = require('express').Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', getDashboardStats);

module.exports = router;
