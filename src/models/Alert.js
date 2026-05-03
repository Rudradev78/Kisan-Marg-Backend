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
    type: String // URL from Cloudinary
  },
  userType: { 
    type: String, 
    enum: ['Farmer', 'Buyer', 'Both'], 
    required: true 
  }
}, { timestamps: true }); // Automatically creates createdAt (time)

module.exports = mongoose.model('Alert', AlertSchema);