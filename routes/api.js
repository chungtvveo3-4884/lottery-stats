// routes/api.js (Đã cập nhật)
const express = require('express');
const router = express.Router();
const scoringService = require('../services/scoringService');
const scoringStatsGenerator = require('../services/scoringStatsGenerator');

// API: Cung cấp dữ liệu điểm tổng hợp đã được cache
router.get('/scoring/stats', async (req, res) => {
    try {
        const scoringStats = await scoringService.getScoringStats();
        if (scoringStats && scoringStats.results) {
            res.json(scoringStats);
        } else {
            res.status(404).json({ message: 'Không tìm thấy dữ liệu thống kê điểm.' });
        }
    } catch (error) {
        console.error('Lỗi API getScoringStats:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê.' });
    }
});

// API: Xử lý các yêu cầu tìm kiếm tùy chỉnh "sống"
router.post('/scoring/search', async (req, res) => {
    try {
        const searchOptions = req.body;
        if (!searchOptions.startDate || !searchOptions.endDate || !searchOptions.mode) {
            return res.status(400).json({ message: 'Thiếu các tham số tìm kiếm bắt buộc.' });
        }
        
        const searchResult = await scoringStatsGenerator.performCustomSearch(searchOptions);
        res.json(searchResult);
    } catch (error) {
        console.error('Lỗi API searchScoring:', error);
        res.status(500).json({ message: 'Lỗi server khi thực hiện tìm kiếm.' });
    }
});

module.exports = router;