const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  heading: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String // URL from Cloudinary if applicable
  },
  time: { 
    type: Date, 
    default: Date.now 
  },
  userType: { 
    type: String, 
    enum: ['Farmer', 'Buyer', 'Both'], 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);