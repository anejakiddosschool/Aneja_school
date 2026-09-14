// backend/routes/studentAuthRoutes.js
const express = require('express');
const { protectStudent } = require('../middleware/authMiddleware');
const { loginStudent, changePassword, updatePhone } = require('../controllers/studentAuthController'); 

const router = express.Router();

router.post('/login', loginStudent);
router.put('/change-password', protectStudent, changePassword);
router.put('/phone', protectStudent, updatePhone);

module.exports = router;