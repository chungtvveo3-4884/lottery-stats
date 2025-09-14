// routes/alternatingNumberPairs.js
const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController');

router.get('/', lotteryController.getAlternatingNumberPairs);

module.exports = router;