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
    
    // 1. Upload image to Cloudinary if it exists
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_alerts");
      imageUrl = result.secure_url;
    }

    // 2. Save the Alert record (for the Alerts Tab)
    const alert = await Alert.create({ 
      heading, 
      description, 
      userType, 
      image: imageUrl 
    });

    // 3. BROADCAST LOGIC: Find targeted users
    // We use a Case-Insensitive regex to ensure "Farmer" matches "farmer"
    let userQuery = {};
    if (userType === 'Farmer') {
      userQuery = { role: { $regex: /^farmer$/i } }; 
    } else if (userType === 'Buyer') {
      userQuery = { role: { $regex: /^buyer$/i } };
    } else if (userType === 'Both') {
      // Find everyone who is either a farmer or a buyer
      userQuery = { role: { $in: [/^farmer$/i, /^buyer$/i] } };
    }

    const users = await User.find(userQuery).select('_id');

    // DEBUG LOG: Check your terminal! If this says 0, your roles don't match.
    console.log(`--- ALERT BROADCAST ---`);
    console.log(`Target: ${userType} | Users Found: ${users.length}`);

    // 4. Create a Notification entry for every user found
    // This is what the Mobile App "polls" for every 10 seconds
    const notificationPromises = users.map(user => 
      sendInternalNotification(
        user._id,
        `📢 ${heading}`,
        description,
        "AdminAlert"
      )
    );

    await Promise.all(notificationPromises);

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