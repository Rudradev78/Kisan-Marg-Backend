const express = require('express');
const router = express.Router();
const multer = require('multer');

// Setup Multer (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

const { 
  getHomeSliders, 
  createSliderGroup, 
  addCardToSlider, 
  deleteSliderGroup,
  deleteSliderCard,
  updateSliderCard,
  uploadSliderImage // 👈 New function from controller
} = require('../controllers/sliderController');

// Standard CRUD
router.get('/', getHomeSliders);
router.post('/', createSliderGroup);
router.delete('/:id', deleteSliderGroup);
router.patch('/:id/add', addCardToSlider);
router.patch('/:sliderId/edit/:cardId', updateSliderCard);
router.delete('/:sliderId/card/:cardId', deleteSliderCard);

// 🟢 The Single Upload Route for the Website
// The frontend must use formData.append('image', file)
router.post('/upload', upload.single('image'), uploadSliderImage);

module.exports = router;