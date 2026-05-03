const Alert = require('../models/Alert');
const User = require("../models/User");
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const sendInternalNotification = require("../utils/notificationHelper");

// @desc    Create Alert & Broadcast to Notifications
// @route   POST /api/v1/alerts
exports.createAlert = async (req, res) => {
  try {
    const { heading, description, userType } = req.body;
    let imageUrl = "";
    
    // 1. Handle Image Upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_alerts");
      imageUrl = result.secure_url;
    }

    // 2. Save the Alert (This makes it show up in the "Alerts Tab")
    const alert = await Alert.create({ 
      heading, 
      description, 
      userType, 
      image: imageUrl 
    });

    // 3. BROADCAST LOGIC: Normalize the input to avoid casing bugs
    let userQuery = {};
    const normalizedTarget = userType ? userType.toLowerCase() : 'both';

    if (normalizedTarget === 'farmer') {
      // Finds 'farmer', 'Farmer', 'FARMER', etc.
      userQuery = { role: { $regex: /^farmer$/i } }; 
    } else if (normalizedTarget === 'buyer') {
      userQuery = { role: { $regex: /^buyer$/i } };
    } else {
      // If 'Both' or 'All', find everyone who isn't an admin
      userQuery = { role: { $ne: 'admin' } };
    }

    // 4. Find the Users
    const users = await User.find(userQuery).select('_id');

    // 🔴 CRITICAL LOGS: Check your terminal when you send the alert!
    console.log(`--- BROADCAST ATTEMPT ---`);
    console.log(`Targeting: ${userType} (Normalized: ${normalizedTarget})`);
    console.log(`Users matching this role in DB: ${users.length}`);

    // 5. Create the Notification Trigger for each user found
    // This is what makes the popup slide down in the app
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
      console.log(`✅ ${users.length} Notifications successfully created.`);
    } else {
      console.log(`⚠️ No users found matching the role "${userType}".`);
    }

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error("Alert Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Alerts (Public/Filtered)
// @route   GET /api/v1/alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};

    // If type is 'Farmer', we show alerts meant for 'Farmer' OR 'Both'
    if (type && type !== 'All') {
      query = { userType: { $in: [type, 'Both'] } };
    }

    const alerts = await Alert.find(query).sort('-createdAt');
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Alert
// @route   DELETE /api/v1/alerts/:id
exports.deleteAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};