const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); 
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendInternalNotification = require('../utils/notificationHelper');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order ID
// @route   POST /api/v1/orders/razorpay
exports.createRazorpayOrder = async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // Razorpay works in paise (₹1 = 100 paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const rzpOrder = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order: rzpOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Payment and Split into Multiple Orders
// @route   POST /api/v1/orders/verify
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const orderPromises = cartItems.map(async (item) => {
        const fId = item.farmerId?._id || item.farmerId;

        if (!fId) {
          throw new Error(`Product "${item.productName}" is missing the farmerId!`);
        }

        const newOrder = await Order.create({
          farmerId: fId,
          buyerId: req.user.id,
          product: item._id,
          quantity: item.qty,
          totalPrice: (item.pricePerUnit * item.qty),
          deliveryFee: 20 / cartItems.length,
          transactionId: razorpay_payment_id,
          status: 'Requested'
        });

        // 1st Notification - Notify Farmer about New Razorpay Order
        await sendInternalNotification(
          fId,
          "New Order Received! 🌾",
          `You have a new paid order for ${item.productName} (${item.qty}kg).`,
          "NewOrder"
        );

        return newOrder;
      });

      await Promise.all(orderPromises);
      return res.status(200).json({ success: true, message: "Orders Created" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Bulk COD Orders
// @route   POST /api/v1/orders/bulk-cod
exports.createBulkCOD = async (req, res) => {
  try {
    const { cartItems } = req.body;

    const orderPromises = cartItems.map(async (item) => {
      const fId = item.farmerId?._id || item.farmerId;

      if (!fId) {
        throw new Error(`Product "${item.productName}" is missing the farmerId!`);
      }

      const newOrder = await Order.create({
        farmerId: fId,
        buyerId: req.user.id,
        product: item._id,
        quantity: item.qty,
        totalPrice: (item.pricePerUnit * item.qty),
        deliveryFee: 20 / cartItems.length,
        transactionId: "COD",
        status: 'Requested'
      });

      // 1st Notification - Notify Farmer about New COD Order
      await sendInternalNotification(
        fId,
        "New COD Order! 🚚",
        `You have a new Cash on Delivery order for ${item.productName}.`,
        "NewOrder"
      );

      return newOrder;
    });

    await Promise.all(orderPromises);
    res.status(201).json({ success: true, message: "COD Orders Placed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new order (Standard Single Order)
exports.createOrder = async (req, res) => {
  try {
    const { productId, quantity, deliveryFee, handlingCharge } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const totalPrice = (product.pricePerUnit * quantity) + (deliveryFee || 0) + (handlingCharge || 0);

    const order = await Order.create({
      buyerId: req.user.id,
      farmerId: product.farmerId,
      product: productId,
      quantity,
      totalPrice,
      deliveryFee,
      handlingCharge,
      status: 'Requested'
    });

    // 1st Notification - Notify Farmer
    await sendInternalNotification(
      product.farmerId, 
      "New Order Received! 🌾", 
      `You have a new order for ${product.productName}. Check your Requests tab!`,
      "NewOrder"
    );

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Order Status (Farmer Action)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body; 
    // We populate 'product' to get the name for the notification message
    const order = await Order.findById(req.params.id).populate('product');

    if (status === 'Completed' && order.status !== 'Completed') {
      const farmer = await User.findById(order.farmerId);
      farmer.balance += order.totalPrice;
      await farmer.save();
    }

    order.status = status;
    await order.save();

    // 2nd Notification - Notify Buyer about Status Change
    await sendInternalNotification(
      order.buyerId, 
      "Order Update 📦", 
      `Your order for ${order.product.productName} is now ${status}.`,
      "OrderUpdate"
    );
    
    res.status(200).json({ success: true, data: order });
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

// @desc    Get Sales History for Farmer (Completed/Cancelled only)
// @route   GET /api/v1/orders/farmer/history
exports.getFarmerHistory = async (req, res) => {
  try {
    const history = await Order.find({ 
      farmerId: req.user.id, 
      status: { $in: ['Completed', 'Cancelled'] } 
    })
    .populate('buyerId', 'name location')
    .populate('product', 'productName')
    .sort('-updatedAt');

    // Calculate Summary Stats
    const totalSales = history
      .filter(o => o.status === 'Completed')
      .reduce((sum, order) => sum + order.totalPrice, 0);

    const ordersDone = history.filter(o => o.status === 'Completed').length;

    res.status(200).json({
      success: true,
      stats: { totalSales, ordersDone },
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Buyer's Order History
// @route   GET /api/v1/orders/buyer
exports.getBuyerOrders = async (req, res) => {
  try {
    // Find orders where buyerId matches the logged-in user
    const orders = await Order.find({ buyerId: req.user.id })
      .populate('product', 'productName productImageURL unitGiven')
      .populate('farmerId', 'farmName')
      .sort('-createdAt'); // Newest first

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { rating, review },
      { new: true }
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Single Order Details
// @route   GET /api/v1/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    // 🟢 CRITICAL: You must populate 'buyerId' to get the name and phone
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name phno') 
      .populate('farmerId', 'farmName location')
      .populate('product', 'productName productImageURL unitGiven');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};