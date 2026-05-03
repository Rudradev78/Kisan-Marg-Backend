const Notification = require('../models/Notification');

const sendInternalNotification = async (recipientId, title, message, type) => {
  try {
    await Notification.create({
      recipient: recipientId,
      title,
      message,
      type
    });
    console.log(`Notification stored for user: ${recipientId}`);
  } catch (err) {
    console.error("Error storing notification:", err);
  }
};

module.exports = sendInternalNotification;