const express = require('express');
const router = express.Router();
const { updateAddress, toggleWishlist } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.put('/address', updateAddress);
router.post('/wishlist', toggleWishlist);

module.exports = router;