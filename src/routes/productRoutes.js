const express = require('express');
const router = express.Router();
const { 
    createProduct, 
    getMarketProducts, 
    getFarmerProducts, 
    updateProduct, 
    deleteProduct,
    getProductById,
    searchProducts
} = require('../controllers/productController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==========================================
//   PUBLIC / BUYER ROUTES (No Login Required)
// ==========================================

// @desc    Get top 10 products for the Home Page
// @route   GET /api/v1/products/market
router.get('/market', getMarketProducts);

// @desc    Search products by name (substring)
// @route   GET /api/v1/products/search
// NOTE: This MUST stay above the /:id route
router.get('/search', searchProducts);

// @desc    Get single product details by ID
// @route   GET /api/v1/products/:id
router.get('/:id', getProductById);


// ==========================================
//   PRIVATE / FARMER ROUTES (Protected)
// ==========================================

// @desc    Upload new crop with image
// @route   POST /api/v1/products/upload
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

module.exports = router;