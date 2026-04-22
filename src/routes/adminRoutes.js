const express = require('express');
const router = express.Router();
const { adminLogin, getDashboardStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Public Admin Login
router.post('/login', adminLogin);

// Protected Dashboard Stats
router.get('/dashboard', protect, getDashboardStats);

module.exports = router;