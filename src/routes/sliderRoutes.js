const express = require('express');
const router = express.Router();
const { getHomeSliders } = require('../controllers/sliderController');

router.get('/', getHomeSliders);

module.exports = router;