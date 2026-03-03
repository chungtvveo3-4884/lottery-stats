// routes/streakBacktestRoutes.js
const express = require('express');
const router = express.Router();
const streakBacktestController = require('../controllers/streakBacktestController');

// API endpoint
router.get('/api/streak-backtest', streakBacktestController.getBacktestResults);

// Trang HTML
router.get('/streak-backtest', (req, res) => {
    res.render('streak-backtest');
});

module.exports = router;
