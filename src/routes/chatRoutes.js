const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/messages', getMessages);
router.post('/send', sendMessage);

module.exports = router;