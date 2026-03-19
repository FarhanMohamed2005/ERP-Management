const router = require('express').Router();
const { getInsights, chat, getReorderSuggestions, getAnomalies, getStatus, generateDescription, getSalesForecast } = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/insights', getInsights);
router.post('/chat', chat);
router.get('/reorder-suggestions', getReorderSuggestions);
router.get('/anomalies', getAnomalies);
router.get('/status', getStatus);
router.post('/generate-description', generateDescription);
router.get('/forecast', getSalesForecast);

module.exports = router;
