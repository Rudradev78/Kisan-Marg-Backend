const express = require('express');
const router = express.Router();
const { 
    createProduct, 
    getMarketProducts, 
    getFarmerProducts, 
    updateProduct, 
    deleteProduct,
    getProductById
} = require('../controllers/productController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- PUBLIC / BUYER ROUTES ---

// @desc    Get top 10 products for the Home Page
// @route   GET /api/v1/products/market
router.get('/market', getMarketProducts);


// --- PRIVATE / FARMER ROUTES (Protected) ---

// @desc    Upload new crop with image
// @route   POST /api/v1/products/upload
// Note: 'image' must match the key used in Frontend FormData
router.post('/upload', protect, upload.single('image'), createProduct);

// @desc    Get all products belonging to the logged-in farmer
// @route   GET /api/v1/products/farmer
router.get('/farmer', protect, getFarmerProducts);

// @desc    Update specific product details
// @route   PUT /api/v1/products/:id
router.put('/:id', protect, updateProduct);

// @desc    Delete a product from inventory
// @route   DELETE /api/v1/products/:id
router.delete('/:id', protect, deleteProduct);

// Add this to your existing productRoutes.js
router.get('/:id', getProductById);

module.exports = router;