const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  updateOrderStatus, 
  deleteOrder, 
  getFarmerOrders,
  getFarmerHistory,
  getBuyerOrders,
  getOngoingOrders, // 🟢 Added this import
  createRazorpayOrder,
  verifyPayment,
  createBulkCOD,
  submitReview,
  getOrderById
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// ==========================================
//   STATIC ROUTES (Defined First)
// ==========================================

router.get('/farmer/history', protect, getFarmerHistory); 
router.get('/ongoing', protect, getOngoingOrders); // 🟢 ADDED: Fixes the "ongoing" casting error
router.get('/farmer', protect, getFarmerOrders);
router.get('/buyer', protect, getBuyerOrders);

router.post('/', protect, createOrder);
router.post('/razorpay', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/bulk-cod', protect, createBulkCOD); 

// ==========================================
//   DYNAMIC ROUTES (Defined Last)
// ==========================================

router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/review', protect, submitReview);
router.delete('/:id', protect, deleteOrder);

module.exports = router;