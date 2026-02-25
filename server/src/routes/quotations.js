const router = require('express').Router();
const { getQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation, convertToSalesOrder } = require('../controllers/quotationController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.route('/').get(authorize('Admin', 'Sales'), getQuotations).post(authorize('Admin', 'Sales'), createQuotation);
router.post('/:id/convert', authorize('Admin', 'Sales'), convertToSalesOrder);
router.route('/:id').get(getQuotation).put(authorize('Admin', 'Sales'), updateQuotation).delete(authorize('Admin', 'Sales'), deleteQuotation);

module.exports = router;
