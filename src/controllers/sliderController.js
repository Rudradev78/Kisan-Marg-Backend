const Slider = require('../models/Slider');

// @desc    Create a new empty slider group
exports.createSliderGroup = async (req, res) => {
  try {
    const slider = await Slider.create(req.body);
    res.status(201).json({ success: true, data: slider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a card (image/title/link) to an existing slider
exports.addCardToSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    slider.sliderImages.push(req.body);
    await slider.save();
    res.status(200).json({ success: true, data: slider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a specific card inside the array
exports.updateSliderCard = async (req, res) => {
  try {
    const { sliderId, cardId } = req.params;
    const slider = await Slider.findById(sliderId);
    const card = slider.sliderImages.id(cardId);
    Object.assign(card, req.body);
    await slider.save();
    res.status(200).json({ success: true, data: slider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a specific card
exports.deleteSliderCard = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.sliderId);
    slider.sliderImages.pull(req.params.cardId);
    await slider.save();
    res.status(200).json({ success: true, data: slider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete the entire slider group
exports.deleteSliderGroup = async (req, res) => {
  try {
    await Slider.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Slider group removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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