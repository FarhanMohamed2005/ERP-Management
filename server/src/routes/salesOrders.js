const router = require('express').Router();
const { getSalesOrders, getSalesOrder, createSalesOrder, updateSalesOrder, deleteSalesOrder } = require('../controllers/salesOrderController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.route('/').get(authorize('Admin', 'Sales'), getSalesOrders).post(authorize('Admin', 'Sales'), createSalesOrder);
router.route('/:id').get(getSalesOrder).put(authorize('Admin', 'Sales'), updateSalesOrder).delete(authorize('Admin'), deleteSalesOrder);

module.exports = router;
