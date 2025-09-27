// routes/api.js (Đã cập nhật cho Mô phỏng)
const express = require('express');
const router = express.Router();
const scoringService = require('../services/scoringService');
const scoringStatsGenerator = require('../services/scoringStatsGenerator');
const { scoringForms } = require('../utils/lotteryScoring');
const simulationService = require('../services/simulationService'); // Import service mới
const statisticsController = require('../controllers/statisticsController');

// API: Cung cấp dữ liệu điểm tổng hợp đã được cache
router.get('/scoring/stats', async (req, res) => {
    try {
        const scoringStats = await scoringService.getScoringStats();
        res.json(scoringStats || {});
    } catch (error) {
        console.error('Lỗi API getScoringStats:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê.' });
    }
});

// API: Xử lý các yêu cầu tìm kiếm tùy chỉnh
router.post('/scoring/search', async (req, res) => {
    try {
        const searchOptions = req.body;
        if (!searchOptions.startDate || !searchOptions.endDate) {
            return res.status(400).json({ message: 'Thiếu các tham số tìm kiếm bắt buộc.' });
        }
        
        const searchResult = await scoringStatsGenerator.performCustomSearch(searchOptions);
        res.json(searchResult);
    } catch (error) {
        console.error('Lỗi API searchScoring:', error);
        res.status(500).json({ message: 'Lỗi server khi thực hiện tìm kiếm.' });
    }
});

// API MỚI: Cung cấp danh sách các dạng số cho trang mô phỏng
router.get('/scoring/forms', (req, res) => {
    try {
        // Chỉ gửi những thông tin cần thiết cho client để tránh lỗi
        const formsForClient = scoringForms.map(({ n, description }) => ({ n, description }));
        res.json(formsForClient);
    } catch (error) {
        res.status(500).json({ message: 'Không thể tải danh sách các dạng số.' });
    }
});

// API MỚI: Chạy mô phỏng
router.post('/simulation/run', (req, res) => {
    try {
        const options = req.body;
        const results = simulationService.runSimulation(options);
        res.json(results);
    } catch (error) {
        console.error('Lỗi khi chạy mô phỏng:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/suggestions', statisticsController.getSuggestions);

module.exports = router;