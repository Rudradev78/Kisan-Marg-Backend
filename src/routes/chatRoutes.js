const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');

// No middleware (protect) for simple project demo
router.post('/messages', getMessages);
router.post('/send', sendMessage);

module.exports = router;