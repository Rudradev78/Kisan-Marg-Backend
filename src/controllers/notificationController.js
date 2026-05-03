const Notification = require('../models/Notification');

// @desc    Get all notifications for the logged-in user
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }) // Newest first
      .limit(20);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    console.error("Get Notifications Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch notifications"
    });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Ensure the notification belongs to the person trying to read it
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this notification"
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error("Mark Read Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not update notification"
    });
  }
};