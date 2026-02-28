const router = require('express').Router();
const { getSettings, updateSettings, initSettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(auth);

router.route('/').get(getSettings).put(authorize('Admin'), updateSettings);
router.post('/init', authorize('Admin'), initSettings);

module.exports = router;
