const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, getUserStats } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // You need your protect middleware here

router.post('/login', sendOTP);
router.post('/verify', verifyOTP);

// This is the new route for your Home Page Part 4
router.get('/stats', protect, getUserStats); 

module.exports = router;