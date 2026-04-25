const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  phno: { type: String, required: true }, 
  email: { type: String }, 
  aadhar: { type: String }, // Redacted for privacy
  dpImageURL: { type: String, default: 'https://via.placeholder.com/150' }, 
  userType: { type: String, enum: ['Farmer', 'Buyer', 'Admin'], required: true }, 
  location: { type: String }, // Manual/Map Location
  isLogged: { type: Boolean, default: false },
  rating: { type: Number, default: 0 }, 
  
  // --- Farmer Specific Business Details ---
  farmName: { type: String, default: "" },
  businessAddress: { type: String, default: "" },
  experience: { type: String, default: "0" },
  totalSales: { type: Number, default: 0 },
  transactionModes: [String], 
  stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, 
  locationCoords: {
    latitude: { type: Number, default: 20.2961 }, // Default to Odisha/Bhubaneswar
    longitude: { type: Number, default: 85.8245 }
  },
  
  // Buyer Specific
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], 
  
  // Auth Logic
  otp: String,
  otpExpires: Date,
  otpChances: { type: Number, default: 5 }, 
  lockUntil: Date 
}, { timestamps: true }); 

UserSchema.index({ phno: 1, userType: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);