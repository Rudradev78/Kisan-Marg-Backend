const Alert = require('../models/Alert');
const User = require("../models/User");
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const sendInternalNotification = require("../utils/notificationHelper");

// Create Alert
exports.createAlert = async (req, res) => {
  try {
    const { heading, description, userType } = req.body;
    let imageUrl = "";
    
    // 1. Upload image to Cloudinary if it exists
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_alerts");
      imageUrl = result.secure_url;
    }

    // 2. Save the Alert record in the database
    const alert = await Alert.create({ 
      heading, 
      description, 
      userType, 
      image: imageUrl 
    });

    // 3. BROADCAST LOGIC: Find targeted users
    let userQuery = {};
    if (userType === 'Farmer') {
      userQuery = { role: 'farmer' }; // Ensure this matches your User model role names
    } else if (userType === 'Buyer') {
      userQuery = { role: 'buyer' };
    } 
    // If userType is 'Both', userQuery remains empty {} to fetch all users

    const users = await User.find(userQuery).select('_id');

    // 4. Create a Notification entry for every user found
    // This triggers the global "swipeable popup" we are building
    const notificationPromises = users.map(user => 
      sendInternalNotification(
        user._id,
        `📢 ${heading}`,
        description,
        "AdminAlert"
      )
    );

    // Wait for all notifications to be created
    await Promise.all(notificationPromises);

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
    if (type && type !== 'All') query.userType = type;
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