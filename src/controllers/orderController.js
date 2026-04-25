const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order (Buyer Action)
// @route   POST /api/v1/orders
exports.createOrder = async (req, res) => {
  try {
    const { 
      productId, 
      quantity, 
      discount, 
      deliveryFee, 
      handlingCharge 
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Calculate Total Price
    const totalPrice = (product.pricePerUnit * quantity) + (deliveryFee || 0) + (handlingCharge || 0) - (discount || 0);

    const order = await Order.create({
      buyerId: req.user.id,
      farmerId: product.farmerId,
      product: productId,
      quantity,
      totalPrice,
      deliveryFee,
      handlingCharge,
      discount,
      status: 'Requested'
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
    const { status } = req.body; 
    // Possible: Requested, Accepted, Packed, Out for Delivery, Completed, Cancelled
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Authorization: Only the farmer assigned to this order can update it
    if (order.farmerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized to update this order" });
    }

    order.status = status;
    
    // If completed, check if transaction ID is provided
    if (status === 'Completed' && req.body.transactionId) {
      order.transactionId = req.body.transactionId;
    }

    await order.save();
    res.status(200).json({ success: true, message: `Order marked as ${status}`, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deny Order (Farmer Action - Deletes from DB as requested)
// @route   DELETE /api/v1/orders/:id
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Authorization
    if (order.farmerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    await order.deleteOne();
    res.status(200).json({ success: true, message: "Order denied and removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Farmer's Orders (Used by the Orders.js page)
// @route   GET /api/v1/orders/farmer
exports.getFarmerOrders = async (req, res) => {
  try {
    // We populate buyerId to get the name/location and product for the thumbnail/name
    const orders = await Order.find({ farmerId: req.user.id })
      .populate('buyerId', 'name location phno') 
      .populate('product', 'productName productImageURL')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};