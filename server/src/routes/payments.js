const router = require('express').Router();
const { createPayment, getPaymentsByInvoice } = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);
router.post('/', authorize('Admin', 'Sales'), createPayment);
router.get('/:invoiceId', authorize('Admin', 'Sales'), getPaymentsByInvoice);

module.exports = router;
