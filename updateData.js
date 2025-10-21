// updateData.js (Phiên bản đã sửa lỗi)
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const generateNumberStats = require('./services/statisticsGenerator');
const generateHeadTailStats = require('./services/headTailStatsGenerator');
const generateSumDifferenceStats = require('./services/sumDifferenceStatsGenerator'); 
const statisticsService = require('./services/statisticsService'); // <-- Thêm dòng này
const DATA_FILE = path.join(__dirname, 'data', 'xsmb-2-digits.json');
const scoringService = require('./services/scoringService'); // <-- THÊM DÒNG NÀY
const lotteryService = require('./services/lotteryService'); // Import service mới
const { checkAndUpdateHistory, analyzeAndSavePrediction } = require('./services/dailyAnalysisService'); 

// URL API để lấy dữ liệu mới nhất
const API_URL = 'https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/refs/heads/main/data/xsmb-2-digits.json';

const updateJsonFile = async () => {
    console.log(`[DATA UPDATE] Bắt đầu lấy dữ liệu từ GitHub: ${API_URL}...`);
    try {
        const response = await axios.get(API_URL);
        const githubData = response.data;

        if (githubData && Array.isArray(githubData) && githubData.length > 0) {
            githubData.sort((a, b) => new Date(a.date) - new Date(b.date));
            fs.writeFileSync(DATA_FILE, JSON.stringify(githubData, null, 2), 'utf8');
            console.log(`[DATA UPDATE] Đã cập nhật file ${DATA_FILE} thành công.`);

            // Xóa cache cũ trước khi tạo file mới
            await statisticsService.clearCache();
            console.log('[CACHE] Đã xóa cache thống kê cũ.');

            // Tạo lại tất cả các file thống kê và chờ chúng hoàn thành
            await Promise.all([
                generateNumberStats(),
                generateHeadTailStats(),
                generateSumDifferenceStats()
            ]);
            console.log('Tất cả các file thống kê đã được tạo lại thành công!');

            // Nạp lại cache và quan trọng nhất là "await" cho nó xong
            await statisticsService.getStatsData();
            console.log('[CACHE] Đã nạp lại cache thống kê mới.');
            await lotteryService.loadRawData();
            // Tải lại các dịch vụ khác nếu cần
            await scoringService.loadScoringStatistics();
            // 2. Đối chiếu kết quả cũ (nếu có)
            await checkAndUpdateHistory();
            // 3. Sau khi đối chiếu xong, tạo dự đoán mới cho ngày mai
            await analyzeAndSavePrediction();
            console.log('[SCORING] Đã tính toán và nạp lại cache điểm.');

            return true;
        } else {
            console.log('[DATA UPDATE] Không nhận được dữ liệu hợp lệ từ GitHub.');
            await analyzeAndSavePrediction();
            return false;
        }
    } catch (error) {
        console.error(`[DATA UPDATE] Lỗi khi cập nhật file dữ liệu:`, error.message);
        return false;
    }
};

module.exports = { updateJsonFile };