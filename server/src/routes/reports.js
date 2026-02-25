const router = require('express').Router();
const {
  salesSummary,
  purchaseSummary,
  inventoryReport,
  invoiceSummary,
} = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/sales-summary', salesSummary);
router.get('/purchase-summary', purchaseSummary);
router.get('/inventory', inventoryReport);
router.get('/invoice-summary', invoiceSummary);

module.exports = router;
