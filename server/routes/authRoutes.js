const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');


// Public routes
router.post('/login', login);

// Protected admin routes
router.post('/register/admin', protect, authorize('admin'), register);

module.exports = router;