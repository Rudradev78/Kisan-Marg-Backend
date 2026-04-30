const Slider = require('../models/Slider');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper'); // 👈 Double check this path!

// @desc    Upload Image to Cloudinary (Specific for Sliders)
exports.uploadSliderImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    // Uses your existing helper buffer logic
    const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_sliders");

    res.status(200).json({
      success: true,
      url: result.secure_url
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
    if (!slider) return res.status(404).json({ success: false, message: "Slider group not found" });
    
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
    
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    
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
exports.getHomeSliders = async (req, res) => {
  try {
    const { userType } = req.query;
    let query = { isActive: true };

    if (userType && userType !== 'All') {
      query.userType = { $in: [userType, 'Both'] };
    }

    const sliders = await Slider.find(query).sort('sliderPosition');
    res.status(200).json({ success: true, count: sliders.length, data: sliders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};