const router = require('express').Router();
const { getSuppliers, getAllSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, importSuppliers } = require('../controllers/supplierController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.get('/all', getAllSuppliers);
router.post('/import', authorize('Admin', 'Purchase'), importSuppliers);
router.route('/').get(authorize('Admin', 'Purchase'), getSuppliers).post(authorize('Admin', 'Purchase'), createSupplier);
router.route('/:id').get(getSupplier).put(authorize('Admin', 'Purchase'), updateSupplier).delete(authorize('Admin'), deleteSupplier);

module.exports = router;
