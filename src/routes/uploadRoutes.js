const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // Adjust path to your upload.js
const { uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// 'image' must match the key used in Sliders.jsx (formData.append('image', ...))
router.post('/', upload.single('image'), uploadImage);

module.exports = router;