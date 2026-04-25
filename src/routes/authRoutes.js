const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, getUserStats } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // You need your protect middleware here

router.post('/login', sendOTP);
router.post('/verify', verifyOTP);
router.get('/stats', protect, getUserStats); 
router.put('/profile', protect, upload.single('image'), updateProfile);

module.exports = router;