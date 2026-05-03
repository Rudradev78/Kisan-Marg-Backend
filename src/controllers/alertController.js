const Alert = require('../models/Alert');
const User = require("../models/User");
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const sendInternalNotification = require("../utils/notificationHelper");

// @desc    Create Alert & Broadcast using userType
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

    // --- BROADCAST LOGIC (Corrected to userType) ---
    let userFilter = {};

    if (userType === 'Farmer') {
      // Matches 'Farmer' in your DB (Case-insensitive regex is safer for demos)
      userFilter = { userType: { $regex: /^farmer$/i } }; 
    } else if (userType === 'Buyer') {
      // Matches 'Buyer' in your DB
      userFilter = { userType: { $regex: /^buyer$/i } };
    } else {
      // 'Both' -> Find everyone who is either a Farmer or Buyer
      userFilter = { userType: { $in: ['Farmer', 'Buyer'] } };
    }

    const users = await User.find(userFilter).select('_id');

    console.log(`--- ALERT BROADCAST ATTEMPT ---`);
    console.log(`Target: ${userType} | Users Found: ${users.length}`);

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
      console.log(`✅ Successfully created ${users.length} notifications in DB.`);
    } else {
      // Debugging check to see what's actually in the collection
      const sample = await User.findOne().select('userType');
      console.log(`❌ No users found. Sample DB entry userType: ${sample ? sample.userType : 'No Users Exist'}`);
    }

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error("Alert Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Alerts (Filtered for Tabs)
exports.getAllAlerts = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    
    // Ensures a Farmer sees 'Farmer' alerts AND 'Both' alerts
    if (type && type !== 'All' && type !== 'Both') {
      query = { userType: { $in: [type, 'Both'] } };
    }
    
    const alerts = await Alert.find(query).sort('-createdAt');
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Alert
exports.deleteAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};