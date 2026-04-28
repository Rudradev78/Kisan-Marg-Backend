const express = require('express');
const router = express.Router();
const { 
  getHomeSliders, 
  createSliderGroup, 
  addCardToSlider, 
  deleteSliderGroup,
  deleteSliderCard,
  updateSliderCard
} = require('../controllers/sliderController');

router.get('/', getHomeSliders);
router.post('/', createSliderGroup);
router.delete('/:id', deleteSliderGroup);
router.patch('/:id/add', addCardToSlider);
router.patch('/:sliderId/edit/:cardId', updateSliderCard);
router.delete('/:sliderId/card/:cardId', deleteSliderCard);

module.exports = router;