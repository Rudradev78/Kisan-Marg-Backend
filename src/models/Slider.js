const mongoose = require('mongoose');

const SliderSchema = new mongoose.Schema({
  description: { type: String }, 
  userType: { type: String, enum: ['Farmer', 'Buyer', 'Both'], required: true },
  sliderPosition: { type: Number, default: 0 }, 
  isActive: { type: Boolean, default: true },
  
  sliderImages: [{
    imgurl: { type: String, required: true },
    title: { type: String },
    link: { type: String }, 
  }]
}, { timestamps: true });

module.exports = mongoose.model('Slider', SliderSchema);