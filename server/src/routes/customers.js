const router = require('express').Router();
const { getCustomers, getAllCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, importCustomers } = require('../controllers/customerController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validateFileUpload, fileUploadRateLimit } = require('../middleware/fileUpload');

router.use(auth);

router.get('/all', getAllCustomers);
router.post('/import', authorize('Admin', 'Sales'), fileUploadRateLimit(), validateFileUpload(['.csv', '.xlsx', '.xls']), importCustomers);
router.route('/').get(authorize('Admin', 'Sales'), getCustomers).post(authorize('Admin', 'Sales'), createCustomer);
router.route('/:id').get(getCustomer).put(authorize('Admin', 'Sales'), updateCustomer).delete(authorize('Admin'), deleteCustomer);

module.exports = router;
