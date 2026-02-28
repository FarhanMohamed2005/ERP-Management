const router = require('express').Router();
const { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { registerRules, loginRules } = require('../middleware/validate');
const auth = require('../middleware/auth');

router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
