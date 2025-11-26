// routes/api.js (Đã cập nhật cho Mô phỏng)
const express = require('express');
const path = require('path'); // <<< SỬA LỖI: Thêm dòng này
const fs = require('fs').promises;
const router = express.Router();
const scoringService = require('../services/scoringService');
const scoringStatsGenerator = require('../services/scoringStatsGenerator');
const { scoringForms } = require('../utils/lotteryScoring');
const simulationService = require('../services/simulationService'); // Import service mới
const statisticsController = require('../controllers/statisticsController');
// **[THÊM VÀO]** Import lotteryService để lấy dữ liệu
const lotteryService = require('../services/lotteryService');
const suggestionsController = require('../controllers/suggestionsController');

// API: Lấy gợi ý (Bao gồm logic loại trừ mới)
router.get('/suggestions', suggestionsController.getSuggestions);

// API: Lấy kết quả xổ số gần đây
router.get('/recent-results', statisticsController.getRecentLotteryResults);

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

// === API CHO PHÂN TÍCH & LỊCH SỬ ===
router.get('/analysis/latest', async (req, res) => {
    try {
        const predictionsPath = path.join(__dirname, '..', 'data', 'predictions.json');
        const data = await fs.readFile(predictionsPath, 'utf-8');
        const predictions = JSON.parse(data);
        if (predictions.length === 0) {
            return res.status(404).json({ error: 'Chưa có dự đoán nào.' });
        }
        const latestPrediction = predictions[predictions.length - 1];
        res.json(latestPrediction);
    } catch (error) {
        if (error.code === 'ENOENT') return res.status(404).json({ error: 'Chưa có file dự đoán.' });
        res.status(500).json({ error: 'Lỗi server khi lấy phân tích.' });
    }
});

router.get('/analysis/history', async (req, res) => {
    try {
        const historyPath = path.join(__dirname, '..', 'data', 'predictions.json');
        const data = await fs.readFile(historyPath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') return res.json([]);
        res.status(500).json({ error: 'Lỗi server khi đọc lịch sử.' });
    }
});

// === API CHO GIẢ LẬP GẤP THẾP ===
router.post('/simulation/run', async (req, res) => {
    try {
        const options = req.body;
        const lotteryData = lotteryService.getRawData();
        if (!lotteryData || lotteryData.length === 0) {
            throw new Error("Cache dữ liệu xổ số trống.");
        }
        const results = await simulationService.runProgressiveSimulation(options, lotteryData);
        res.json(results);
    } catch (error) {
        console.error('Lỗi khi chạy mô phỏng:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;