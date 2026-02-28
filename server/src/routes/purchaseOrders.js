const router = require('express').Router();
const { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = require('../controllers/purchaseOrderController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.route('/').get(authorize('Admin', 'Purchase'), getPurchaseOrders).post(authorize('Admin', 'Purchase'), createPurchaseOrder);
router.route('/:id').get(getPurchaseOrder).put(authorize('Admin', 'Purchase'), updatePurchaseOrder).delete(authorize('Admin'), deletePurchaseOrder);

module.exports = router;
