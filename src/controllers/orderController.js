const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); 
const Razorpay = require('razorpay');
const crypto = require('crypto');

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

    // Log for debugging
    console.log("Verifying Payment for Order:", razorpay_order_id);

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
    const orderPromises = cartItems.map((item, index) => {
      // 1. LOG: See exactly what the backend receives for each item
      console.log(`Checking item ${index}: ${item.productName}`);
      console.log("Full Item Data:", JSON.stringify(item));

      // 2. SAFE FETCH: Handle both cases (farmerId as a string or as an object)
      // If the Home page used .populate, it's an object. If not, it's a string.
      const fId = item.farmerId?._id || item.farmerId;

      // 3. VALIDATION: If fId is still missing, we stop and send a clear error
      if (!fId) {
        throw new Error(`Product "${item.productName}" is missing the farmerId! Please clear your kart and try again.`);
      }

      return Order.create({
        farmerId: fId, // Correctly assigns the string ID
        buyerId: req.user.id,
        product: item._id,
        quantity: item.qty,
        totalPrice: (item.pricePerUnit * item.qty),
        deliveryFee: 20 / cartItems.length,
        transactionId: razorpay_payment_id,
        status: 'Requested'
      });
    });
      await Promise.all(orderPromises);
      return res.status(200).json({ success: true, message: "Orders Created" });
    } else {
      console.log("Signature Mismatch!");
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    console.error("Verify Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Bulk COD Orders
// @route   POST /api/v1/orders/bulk-cod
exports.createBulkCOD = async (req, res) => {
  try {
    const { cartItems } = req.body;

    const orderPromises = cartItems.map((item, index) => {
      // 1. LOG: See exactly what the backend receives for each item
      console.log(`Checking item ${index}: ${item.productName}`);
      console.log("Full Item Data:", JSON.stringify(item));

      // 2. SAFE FETCH: Handle both cases (farmerId as a string or as an object)
      // If the Home page used .populate, it's an object. If not, it's a string.
      const fId = item.farmerId?._id || item.farmerId;

      // 3. VALIDATION: If fId is still missing, we stop and send a clear error
      if (!fId) {
        throw new Error(`Product "${item.productName}" is missing the farmerId! Please clear your kart and try again.`);
      }

      return Order.create({
        farmerId: fId, // Correctly assigns the string ID
        buyerId: req.user.id,
        product: item._id,
        quantity: item.qty,
        totalPrice: (item.pricePerUnit * item.qty),
        deliveryFee: 20 / cartItems.length,
        transactionId:"COD",
        status: 'Requested'
      });
    });

    await Promise.all(orderPromises);
    res.status(201).json({ success: true, message: "COD Orders Placed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
    const order = await Order.findById(req.params.id);

    // If order is finished, credit the farmer's account
    if (status === 'Completed' && order.status !== 'Completed') {
      const farmer = await User.findById(order.farmerId);
      
      // Calculate amount (Price * Qty)
      const creditAmount = order.totalPrice; 
      
      farmer.balance += creditAmount;
      await farmer.save();
    }

    order.status = status;
    await order.save();
    
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