const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  updateOrderStatus, 
  deleteOrder, 
  getFarmerOrders,
  getFarmerHistory,
  getBuyerOrders,
  createRazorpayOrder,
  verifyPayment,
  createBulkCOD,
  submitReview
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/farmer', protect, getFarmerOrders);
router.put('/:id/status', protect, updateOrderStatus);
router.delete('/:id', protect, deleteOrder);
router.get('/farmer/history', protect, getFarmerHistory);
router.get('/buyer', protect, getBuyerOrders);
router.post('/razorpay', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/bulk-cod', protect, createBulkCOD); 
router.put('/:id/review', protect, submitReview);

module.exports = router;