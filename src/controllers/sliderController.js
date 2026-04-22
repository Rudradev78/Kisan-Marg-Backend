const Slider = require('../models/Slider');

// @desc    Fetch Home Page Sliders
// @route   GET /api/v1/sliders
exports.getHomeSliders = async (req, res) => {
  try {
    const { userType } = req.query; // Farmer or Buyer

    // Access Slider Module based on userType variable
    const sliders = await Slider.find({ 
      userType: { $in: [userType, 'Both'] },
      isActive: true 
    }).sort('sliderPosition');

    res.status(200).json({
      success: true,
      data: sliders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};