const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  // The ID of the Farmer or Buyer this chat belongs to
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: [{
    message: { type: String, required: true },
    time: { type: Date, default: Date.now },
    sender: { type: String, enum: ['Admin', 'User'], required: true }, 
    // 'User' refers to the Farmer/Buyer; 'Admin' is the single support admin
  }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);