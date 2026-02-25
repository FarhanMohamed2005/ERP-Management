const router = require('express').Router();
const { getGRNs, getGRN, createGRN } = require('../controllers/grnController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.route('/').get(authorize('Admin', 'Purchase', 'Inventory'), getGRNs).post(authorize('Admin', 'Purchase', 'Inventory'), createGRN);
router.route('/:id').get(getGRN);

module.exports = router;
