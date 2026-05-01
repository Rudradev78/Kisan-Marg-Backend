const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer directly

// Internal Multer Setup (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit for crop images
});

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

// ==========================================
//   PUBLIC / BUYER ROUTES (No Login Required)
// ==========================================

// @desc    Get top 10 products for the Home Page
router.get('/market', getMarketProducts);

// @desc    Search products by name
router.get('/search', searchProducts);

// @desc    Get single product details by ID
router.get('/:id', getProductById);


// ==========================================
//   PRIVATE / FARMER ROUTES (Protected)
// ==========================================

// @desc    Upload new crop with image
// Uses the internal 'upload' variable defined above
router.post('/upload', protect, upload.single('image'), createProduct);

// @desc    Get all products belonging to the logged-in farmer
router.get('/farmer', protect, getFarmerProducts);

// @desc    Update specific product details
router.put('/:id', protect, updateProduct);

// @desc    Delete a product from inventory
router.delete('/:id', protect, deleteProduct);

module.exports = router;