const Alert = require('../models/Alert');
const User = require("../models/User");
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const sendInternalNotification = require("../utils/notificationHelper");

// @desc    Create Alert & Broadcast to App Popups
// @route   POST /api/v1/alerts
exports.createAlert = async (req, res) => {
  try {
    const { heading, description, userType } = req.body;
    let imageUrl = "";
    
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_alerts");
      imageUrl = result.secure_url;
    }

    const alert = await Alert.create({ 
      heading, 
      description, 
      userType, 
      image: imageUrl 
    });

    // 1. BROADCAST LOGIC: Force Case-Insensitive Search
    let userQuery = {};

    if (userType === 'Farmer') {
      // Finds 'farmer', 'Farmer', 'FARMER'
      userQuery = { role: { $regex: /^farmer$/i } }; 
    } else if (userType === 'Buyer') {
      // Finds 'buyer', 'Buyer', 'BUYER'
      userQuery = { role: { $regex: /^buyer$/i } };
    } else {
      // 'Both' -> Find everyone who is NOT an admin (case-insensitive)
      userQuery = { role: { $not: { $regex: /^admin$/i } } };
    }

    const users = await User.find(userQuery).select('_id role');

    // 🔴 DIAGNOSTIC LOG: This will solve the mystery
    console.log(`--- ALERT BROADCAST ATTEMPT ---`);
    console.log(`Admin sent for Target: ${userType}`);
    console.log(`Users Found matching query: ${users.length}`);

    if (users.length === 0) {
      // If we find 0, let's look at what roles actually EXIST in your DB
      const allRoles = await User.distinct('role');
      console.log(`⚠️ ERROR: No users found. Roles currently in your DB are: [${allRoles.join(', ')}]`);
      console.log(`Make sure your Buyer account has one of these roles!`);
    }

    // 2. Create Notifications only if users were found
    if (users.length > 0) {
      const notificationPromises = users.map(user => 
        sendInternalNotification(
          user._id,
          `📢 ${heading}`,
          description,
          "AdminAlert"
        )
      );
      await Promise.all(notificationPromises);
      console.log(`✅ Success: ${users.length} notifications created.`);
    }

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error("Alert Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    // If a Farmer/Buyer asks for alerts, they should see their specific type AND 'Both'
    if (type && type !== 'All' && type !== 'Both') {
      query = { userType: { $in: [type, 'Both'] } };
    }
    const alerts = await Alert.find(query).sort('-createdAt');
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Alert
exports.deleteAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};