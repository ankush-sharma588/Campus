const express = require('express');
const router = express.Router();
const authRequestRateLimit = require('../middleware/authRequestRateLimit');
router.use(authRequestRateLimit);
const { VerifyOtp, ResendOtp, ForgotPassword, ResetPassword } = require('../controllers/Auth/otp.controller');

router.post('/otp/verify', VerifyOtp);
router.post('/otp/resend', ResendOtp);
router.post('/password/forgot', ForgotPassword);
router.post('/password/reset', ResetPassword);

module.exports = router;
