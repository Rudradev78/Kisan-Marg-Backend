const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Admin Login Logic
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check database for the email in admin
    const admin = await User.findOne({ email, userType: 'Admin' });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Check if password is right (In production, use bcrypt)
    if (admin.adminPassword !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check status (if logged in)
    if (admin.isLogged) {
      return res.status(200).json({ 
        success: true, 
        message: "already logged in",
        prompt: "Do you want to logout from other devices?" 
      });
    }

    admin.isLogged = true;
    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ success: true, token, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const farmerNo = await User.countDocuments({ userType: 'Farmer' });
    const buyerNo = await User.countDocuments({ userType: 'Buyer' });
    
    const totalOrders = await Order.countDocuments();
    const completeOrders = await Order.countDocuments({ status: 'Completed' });
    const incompleteOrders = totalOrders - completeOrders;

    // Aggregate data for App Usage and Revenue
    const revenueData = await Order.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        farmerNo,
        buyerNo,
        totalOrders,
        completeOrders,
        incompleteOrders,
        revenue: revenueData[0] ? revenueData[0].total : 0,
        appUsage: "Active"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};