const express = require('express');
const router = express.Router();
const { getLivePrices } = require('../controllers/marketController');

router.get('/prices', getLivePrices);

module.exports = router;