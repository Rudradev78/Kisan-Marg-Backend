const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order (from Kart)
// @route   POST /api/v1/orders
exports.createOrder = async (req, res) => {
  try {
    const { 
      productId, 
      quantity, 
      shippingAddress, 
      discount, 
      deliveryFee, 
      handlingCharge 
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Calculate Total Price as per design
    const totalPrice = (product.pricePerUnit * quantity) + deliveryFee + handlingCharge - (discount || 0);

    const order = await Order.create({
      buyerId: req.user.id,
      farmerId: product.farmerId,
      product: productId,
      quantity,
      totalPrice,
      deliveryFee,
      handlingCharge,
      discount,
      status: 'Requested', // Default status from PDF
      orderingDateTime: new Date()
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Order Status (Farmer Action)
// @route   PUT /api/v1/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body; // Requested, Accepted, Ongoing, Completed, Cancelled
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Ensure only the involved Farmer can update status
    if (order.farmerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    order.status = status;
    
    // If completed, add transaction ID
    if (status === 'Completed' && req.body.transactionId) {
      order.transactionId = req.body.transactionId;
    }

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get My Orders (For Buyer and Farmer)
// @route   GET /api/v1/orders/my-orders
exports.getMyOrders = async (req, res) => {
  try {
    let query;
    if (req.user.userType === 'Farmer') {
      query = { farmerId: req.user.id };
    } else {
      query = { buyerId: req.user.id };
    }

    const orders = await Order.find(query)
      .populate('product', 'productName productImageURL')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};  