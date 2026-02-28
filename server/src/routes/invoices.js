const router = require('express').Router();
const { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.route('/').get(authorize('Admin', 'Sales'), getInvoices).post(authorize('Admin', 'Sales'), createInvoice);
router.route('/:id').get(getInvoice).put(authorize('Admin', 'Sales'), updateInvoice).delete(authorize('Admin'), deleteInvoice);

module.exports = router;
