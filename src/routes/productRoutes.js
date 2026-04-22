const express = require('express');
const router = express.Router();
const { createProduct, getMarketProducts } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('image'), createProduct);
router.get('/market', getMarketProducts);

module.exports = router;