// routes/absenceStreaks.js
const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController');

router.get('/', lotteryController.getAbsenceStreaks);

module.exports = router;