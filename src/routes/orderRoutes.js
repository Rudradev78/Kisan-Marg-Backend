const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  updateOrderStatus, 
  getMyOrders 
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All order routes require login

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.put('/:id/status', updateOrderStatus);

module.exports = router;