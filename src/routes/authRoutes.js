const express = require('express');
const router = express.Router();
const { 
  sendOTP, 
  verifyOTP, 
  getUserStats, 
  updateProfile,
  toggleWishlist
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Existing routes
router.post('/login', sendOTP);
router.post('/verify', verifyOTP);
router.get('/stats', protect, getUserStats);
router.put('/profile', protect, upload.single('image'), updateProfile);
router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;