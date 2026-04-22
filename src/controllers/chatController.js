const Chat = require('../models/Chat');

// @desc    Get or Create Chat between two users
// @route   POST /api/v1/chats/get-chat
exports.getMessages = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.id;

    // Find chat where both users are participants
    let chat = await Chat.findOne({
      participants: { $all: [userId, recipientId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, recipientId],
        messages: []
      });
    }

    res.status(200).json({
      success: true,
      data: chat.messages // Returns the message array one by one
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a new message
// @route   POST /api/v1/chats/send
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const userId = req.user.id;

    const newMessage = {
      message: message, // "Story" text
      time: new Date(),
      sender: req.user.userType, // Admin, Farmer, or Buyer
      senderId: userId
    };

    const chat = await Chat.findOneAndUpdate(
      { participants: { $all: [userId, recipientId] } },
      { $push: { messages: newMessage } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};