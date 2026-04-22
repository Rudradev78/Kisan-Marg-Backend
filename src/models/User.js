const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  phno: { type: String, required: true, unique: true }, 
  email: { type: String }, 
  aadhar: { type: String }, // Optional for Farmers [cite: 5]
  dpImageURL: { type: String }, 
  userType: { type: String, enum: ['Farmer', 'Buyer', 'Admin'], required: true }, 
  location: { type: String },
  isLogged: { type: Boolean, default: false },
  rating: { type: Number, default: 0 }, 
  
  // Farmer Specific
  transactionModes: [String], 
  stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, 
  
  // Buyer Specific
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], 
  
  // Auth Logic
  otp: String,
  otpExpires: Date,
  otpChances: { type: Number, default: 5 }, 
  lockUntil: Date 
}, { timestamps: true }); 

module.exports = mongoose.model('User', UserSchema);