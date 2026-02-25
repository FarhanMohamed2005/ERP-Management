const router = require('express').Router();
const { createPayment, getPaymentsByInvoice } = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/', createPayment);
router.get('/:invoiceId', getPaymentsByInvoice);

module.exports = router;
