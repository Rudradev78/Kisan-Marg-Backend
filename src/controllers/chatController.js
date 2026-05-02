const Chat = require('../models/Chat');

// Get messages for a specific user chat
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.body; 

    let chat = await Chat.findOne({ userId });

    if (!chat) {
      chat = await Chat.create({ userId, messages: [] });
    }

    res.status(200).json({ success: true, data: chat.messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { userId, message, senderType } = req.body;

    const newMessage = {
      message: message,
      time: new Date(),
      sender: senderType, // Pass 'Admin' from Web, 'User' from App
    };

    const chat = await Chat.findOneAndUpdate(
      { userId },
      { $push: { messages: newMessage } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};