const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  updateOrderStatus, 
  deleteOrder, 
  getFarmerOrders 
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/farmer', protect, getFarmerOrders); // <--- For the Orders Screen
router.put('/:id/status', protect, updateOrderStatus); // <--- For status buttons
router.delete('/:id', protect, deleteOrder); // <--- For the Deny button

module.exports = router;