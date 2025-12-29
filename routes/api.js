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
const confidenceSuggestionsController = require('../controllers/confidenceSuggestionsController');

// API: Lấy gợi ý (Logic cũ - tier-based)
router.get('/suggestions', suggestionsController.getSuggestions);

// API: Lấy gợi ý với Confidence Score (Logic mới)
router.get('/suggestions/confidence', confidenceSuggestionsController.getConfidenceSuggestions);

// API: Lấy cấu hình strategies
router.get('/suggestions/strategies', confidenceSuggestionsController.getStrategies);

// API: Lấy cấu hình server
const STATS_CONFIG = require('../config/stats-config');
router.get('/config', (req, res) => {
    res.json({
        GAP_STRATEGY: STATS_CONFIG.GAP_STRATEGY,
        GAP_BUFFER_PERCENT: STATS_CONFIG.GAP_BUFFER_PERCENT,
        GAP_THRESHOLD_PERCENT: STATS_CONFIG.GAP_THRESHOLD_PERCENT,
        USE_CONFIDENCE_SCORE: STATS_CONFIG.USE_CONFIDENCE_SCORE,
        EXCLUSION_STRATEGY: STATS_CONFIG.EXCLUSION_STRATEGY,
        INITIAL_BET_AMOUNT: STATS_CONFIG.INITIAL_BET_AMOUNT,
        BET_STEP_AMOUNT: STATS_CONFIG.BET_STEP_AMOUNT
    });
});

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

// API: Xoá lịch sử dự đoán - chỉ giữ lại dự đoán mới nhất và reset bet amount
router.delete('/analysis/history/clear', async (req, res) => {
    try {
        const { defaultBetAmount = 10 } = req.body || {};
        const historyPath = path.join(__dirname, '..', 'data', 'predictions.json');

        let predictions = [];
        try {
            const data = await fs.readFile(historyPath, 'utf-8');
            predictions = JSON.parse(data);
        } catch (e) {
            // File không tồn tại hoặc rỗng
        }

        if (predictions.length === 0) {
            return res.json({ success: true, message: 'Không có lịch sử để xóa.' });
        }

        // Lấy dự đoán mới nhất
        const latestPrediction = predictions[predictions.length - 1];

        // Reset bet amount về mặc định và xóa totalLossToDate
        latestPrediction.betAmount = defaultBetAmount;
        if (latestPrediction.result) {
            latestPrediction.result.totalLossToDate = 0;
        }

        // Chỉ giữ lại dự đoán mới nhất
        const newPredictions = [latestPrediction];

        await fs.writeFile(historyPath, JSON.stringify(newPredictions, null, 2));

        res.json({
            success: true,
            message: `Đã xóa ${predictions.length - 1} bản ghi lịch sử. Giữ lại dự đoán mới nhất và reset mức cược về ${defaultBetAmount}k.`,
            remaining: newPredictions.length
        });
    } catch (error) {
        console.error('Lỗi khi xóa lịch sử:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa lịch sử.' });
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

// === API CHO GIẢ LẬP TƯƠNG LAI ===
const futureSimulationService = require('../services/futureSimulationService');

router.post('/simulation/future', async (req, res) => {
    try {
        const { duration = 'week', betAmount = 10, betStep = 5 } = req.body;
        const validDurations = ['week', 'month', '3months', 'year'];

        if (!validDurations.includes(duration)) {
            return res.status(400).json({ error: 'Duration không hợp lệ. Chọn: week, month, 3months, year' });
        }

        const results = await futureSimulationService.runSimulation(duration, betAmount, betStep);
        res.json(results);
    } catch (error) {
        console.error('Lỗi khi chạy giả lập tương lai:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;