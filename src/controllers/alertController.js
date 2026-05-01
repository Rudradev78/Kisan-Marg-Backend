const Alert = require('../models/Alert');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');

// Create Alert
exports.createAlert = async (req, res) => {
  try {
    const { heading, description, userType } = req.body;
    let imageUrl = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_alerts");
      imageUrl = result.secure_url;
    }
    const alert = await Alert.create({ heading, description, userType, image: imageUrl });
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
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