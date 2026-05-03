const express = require('express');
const router = express.Router();
const multer = require('multer');

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
//   STATIC ROUTES (Defined First)
// ==========================================

// Public routes
router.get('/market', getMarketProducts);
router.get('/search', searchProducts);

// Private farmer routes
router.post('/upload', protect, upload.single('image'), createProduct);
router.get('/farmer', protect, getFarmerProducts); // This fixes the Stocks page error

// ==========================================
//   DYNAMIC ROUTES (Defined Last)
// ==========================================

router.get('/:id', getProductById);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;