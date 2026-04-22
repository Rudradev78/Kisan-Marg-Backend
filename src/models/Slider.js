const mongoose = require('mongoose');

const SliderSchema = new mongoose.Schema({
  sliderImages: [{
    imgurl: { type: String, required: true }
  }],
  description: { 
    type: String 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  userType: { 
    type: String, 
    enum: ['Farmer', 'Buyer', 'Both'], 
    required: true 
  },
  sliderPosition: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Slider', SliderSchema);