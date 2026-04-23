const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  // REMOVED unique: true from phno
  phno: { type: String, required: true }, 
  email: { type: String }, 
  aadhar: { type: String }, // Redacted digits for privacy in production
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

/**
 * COMPOUND INDEX
 * This allows one number to have multiple accounts (one as Farmer, one as Buyer)
 * but prevents two 'Buyer' accounts with the same number.
 */
UserSchema.index({ phno: 1, userType: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);