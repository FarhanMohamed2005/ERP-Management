const router = require('express').Router();
const { getInsights, chat, getReorderSuggestions, getAnomalies } = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/insights', getInsights);
router.post('/chat', chat);
router.get('/reorder-suggestions', getReorderSuggestions);
router.get('/anomalies', getAnomalies);

module.exports = router;
