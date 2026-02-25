const router = require('express').Router();
const {
  getProducts,
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
} = require('../controllers/productController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/all', getAllProducts);
router.post('/import', importProducts);
router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);

module.exports = router;
