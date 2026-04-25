const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true }, 
  totalPrice: { type: Number, required: true }, 
  discount: { type: Number, default: 0 }, 
  deliveryFee: { type: Number, default: 0 }, 
  handlingCharge: { type: Number, default: 0 }, 
  status: { 
    type: String, 
    enum: ['Requested', 'Accepted', 'Packed', 'Out for Delivery', 'Completed', 'Cancelled'], 
    default: 'Requested' 
  },
  transactionId: { type: String }, 
  rating: { type: Number }, 
  review: { type: String } 
}, { timestamps: true }); 

module.exports = mongoose.model('Order', OrderSchema);