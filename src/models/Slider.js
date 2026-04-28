const mongoose = require('mongoose');

const SliderSchema = new mongoose.Schema({
  description: { type: String }, // General purpose of this slider group
  userType: { type: String, enum: ['Farmer', 'Buyer', 'Both'], required: true },
  sliderPosition: { type: Number, default: 0 }, // 1 = Top, 2 = Middle, etc.
  isActive: { type: Boolean, default: true },
  
  // The Array of Cards/Images
  sliderImages: [{
    imgurl: { type: String, required: true },
    title: { type: String },
    link: { type: String }, // App route/page link
  }]
}, { timestamps: true });

module.exports = mongoose.model('Slider', SliderSchema);