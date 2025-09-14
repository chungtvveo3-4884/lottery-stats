const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController');

router.get('/', lotteryController.getEvenHeadsGreaterThan4);

module.exports = router;