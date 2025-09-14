const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController');

// Xử lý route GET cho /difference-sequences
router.get('/', lotteryController.getDifferenceSequences);

module.exports = router;