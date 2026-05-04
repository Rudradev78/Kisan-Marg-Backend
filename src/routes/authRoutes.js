const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer directly

// Internal Multer Setup (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit for profile pictures
});

const { 
  sendOTP, 
  verifyOTP, 
  getUserStats, 
  updateProfile,
  toggleWishlist,
  deleteAddress,
  getProfileById
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// --- AUTH ROUTES ---

// Login and Verification
router.post('/login', sendOTP);
router.post('/verify', verifyOTP);

// User Stats (Protected)
router.get('/stats', protect, getUserStats);

/**
 * Update Profile
 * Uses internal 'upload' variable to handle profile picture buffers 
 * before passing them to the controller.
 */
router.put('/profile', protect, upload.single('image'), updateProfile);

// Wishlist Management
router.post('/wishlist/:productId', protect, toggleWishlist);

// Address Management
router.delete('/address/:id', protect, deleteAddress);
router.get('/profile/:id', getProfileById); // 🟢 Add this line

module.exports = router;