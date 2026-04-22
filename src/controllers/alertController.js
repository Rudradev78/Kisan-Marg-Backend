const Alert = require('../models/Alert');

// @desc    Get user notifications
// @route   GET /api/v1/alerts
exports.getUserAlerts = async (req, res) => {
  try {
    // Access alerts based on userType variable key
    const alerts = await Alert.find({ 
      userType: { $in: [req.user.userType, 'Both'] } 
    }).sort('-createdAt');

    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};