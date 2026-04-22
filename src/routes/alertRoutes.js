const express = require('express');
const router = express.Router();
const { getUserAlerts } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUserAlerts);

module.exports = router;