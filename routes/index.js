const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController'); // Đảm bảo đường dẫn chính xác

// Route cho trang chủ (render index.html)
router.get('/', (req, res) => {
    res.render('index');
});

// Route API mới cho thống kê tổng hợp
// Sử dụng req.lotteryData đã được tải từ app.js
router.get('/overall-stats', lotteryController.getOverallStats);

module.exports = router;