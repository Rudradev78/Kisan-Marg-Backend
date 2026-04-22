const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  productName: { type: String, required: true }, 
  pricePerUnit: { type: Number, required: true }, 
  unitGiven: { type: String, required: true }, 
  availableQuantity: { type: Number, required: true }, 
  noOfOrders: { type: Number, default: 0 }, 
  productImageURL: { type: String }, 
  rating: { type: Number, default: 0 } 
}, { timestamps: true }); 

module.exports = mongoose.model('Product', ProductSchema);