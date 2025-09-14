const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController');

router.get('/', lotteryController.getOddHeadsGreaterThan5);

module.exports = router;