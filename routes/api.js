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

// === API MỚI CHO TRANG SIMULATION ===

// API lấy phân tích chi tiết cho dự đoán MỚI NHẤT
router.get('/analysis/latest', async (req, res) => {
    try {
        const predictionsPath = path.join(__dirname, '..', 'data', 'predictions.json');
        const predictions = JSON.parse(await fs.readFile(predictionsPath, 'utf-8'));
        
        const latestPrediction = predictions[predictions.length - 1];
        
        if (!latestPrediction) {
            return res.status(404).json({ error: 'Không tìm thấy dự đoán nào.' });
        }
        res.json(latestPrediction);
    } catch (error) {
        if (error.code === 'ENOENT') {
             return res.status(404).json({ error: 'Chưa có file dự đoán nào được tạo.' });
        }
        console.error('Lỗi khi lấy phân tích mới nhất:', error);
        res.status(500).json({ error: 'Lỗi server khi phân tích dữ liệu.' });
    }
});

// API lấy toàn bộ lịch sử dự đoán
router.get('/analysis/history', async (req, res) => {
    try {
        const historyPath = path.join(__dirname, '..', 'data', 'predictions.json');
        const data = await fs.readFile(historyPath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.json([]); 
        }
        console.error('Lỗi khi đọc lịch sử dự đoán:', error);
        res.status(500).json({ error: 'Lỗi server khi đọc file lịch sử.' });
    }
});

// API Chạy mô phỏng (dựa trên phân tích)
router.post('/simulation/run', (req, res) => {
    try {
        const options = req.body;
        const lotteryData = lotteryService.getRawData();
        if (!lotteryData || lotteryData.length === 0) {
             throw new Error('Không có dữ liệu xổ số để chạy mô phỏng.');
        }
        const results = simulationService.runSimulation(options, lotteryData);
        res.json(results);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/suggestions', statisticsController.getSuggestions);

module.exports = router;