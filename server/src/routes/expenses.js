const router = require('express').Router();
const { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, approveExpense, getExpenseSummary } = require('../controllers/expenseController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.get('/summary', authorize('Admin'), getExpenseSummary);
router.route('/').get(authorize('Admin', 'Sales', 'Purchase'), getExpenses).post(authorize('Admin', 'Sales', 'Purchase'), createExpense);
router.put('/:id/approve', authorize('Admin'), approveExpense);
router.route('/:id').get(getExpense).put(authorize('Admin', 'Sales', 'Purchase'), updateExpense).delete(authorize('Admin'), deleteExpense);

module.exports = router;
