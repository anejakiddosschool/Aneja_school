const express = require('express');
const router = express.Router();
const { sendOtp, recoverUsername, resetPassword } = require('../controllers/passwordController');

// Public account-recovery routes (WhatsApp OTP based)
router.post('/send-otp', sendOtp);                    // { phoneNumber, purpose }
router.post('/recover-username', recoverUsername);    // { phoneNumber, otp }
router.post('/reset-password', resetPassword);        // { phoneNumber, otp, newPassword }

module.exports = router;
