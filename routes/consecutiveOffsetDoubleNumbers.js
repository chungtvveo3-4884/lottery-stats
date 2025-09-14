const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController');

router.get('/', lotteryController.getConsecutiveOffsetDoubleNumbers);

module.exports = router;