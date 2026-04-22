const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    message: { type: String, required: true },
    time: { type: Date, default: Date.now },
    sender: { type: String, required: true }, // Admin, Farmer, or Buyer
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);