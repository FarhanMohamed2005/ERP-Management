const router = require('express').Router();
const { getGRNs, getGRN, createGRN, deleteGRN } = require('../controllers/grnController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.route('/').get(authorize('Admin', 'Purchase', 'Inventory'), getGRNs).post(authorize('Admin', 'Purchase', 'Inventory'), createGRN);
router.route('/:id').get(getGRN).delete(authorize('Admin'), deleteGRN);

module.exports = router;
