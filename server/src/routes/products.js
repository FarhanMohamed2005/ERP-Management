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
const { validateFileUpload, fileUploadRateLimit } = require('../middleware/fileUpload');

router.use(auth);

router.get('/all', getAllProducts);
router.post('/import', fileUploadRateLimit(), validateFileUpload(['.csv', '.xlsx', '.xls']), importProducts);
router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);

module.exports = router;
