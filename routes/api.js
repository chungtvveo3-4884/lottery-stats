// routes/api.js
const express = require('express');
const router = express.Router();
const scoringService = require('../services/scoringService'); // <-- THAY ĐỔI
const scoringStatsGenerator = require('../services/scoringStatsGenerator'); // Vẫn cần cho tìm kiếm động

// API: Cung cấp dữ liệu điểm tổng hợp đã được cache
router.get('/scoring/stats', (req, res) => {
    const scoringStats = scoringService.getScoringStats(); // <-- THAY ĐỔI
    if (scoringStats && scoringStats.results) {
        res.json(scoringStats);
    } else {
        res.status(404).json({ message: 'Không tìm thấy dữ liệu thống kê điểm.' });
    }
});

// API: Xử lý các yêu cầu tìm kiếm tùy chỉnh "sống"
router.post('/scoring/search', async (req, res) => {
    try {
        const searchOptions = req.body;
        if (!searchOptions.startDate || !searchOptions.endDate || !searchOptions.mode) {
            return res.status(400).json({ message: 'Thiếu các tham số tìm kiếm bắt buộc.' });
        }
        
        // Gọi trực tiếp hàm tìm kiếm từ generator
        const searchResult = await scoringStatsGenerator.performCustomSearch(searchOptions);
        res.json(searchResult);
    } catch (error) {
        console.error('Lỗi API searchScoring:', error);
        res.status(500).json({ message: 'Lỗi server khi thực hiện tìm kiếm.' });
    }
});

module.exports = router;