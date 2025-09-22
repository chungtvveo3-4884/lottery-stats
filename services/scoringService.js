// services/scoringService.js
const fs = require('fs').promises;
const path = require('path');
// const NodeCache = require('node-cache'); // <- Đã xóa dòng này

const scoringStatsGenerator = require('./scoringStatsGenerator');

const SCORING_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'scoring_stats.json');

// --- THAY THẾ NODE-CACHE BẰNG MỘT BIẾN JAVASCRIPT ĐƠN GIẢN ---
let scoringCache = null;

/**
 * Nạp dữ liệu thống kê điểm vào cache.
 * Quy trình: Chạy generator để tạo file -> Đọc file -> Lưu vào biến cache.
 */
const loadScoringStatistics = async () => {
    try {
        console.log('Bắt đầu quy trình nạp dữ liệu cho Scoring Service...');
        
        // 1. Yêu cầu generator tạo/cập nhật file JSON
        await scoringStatsGenerator.generateScoringStats();

        // 2. Đọc file JSON vừa được tạo
        const scoringStatsContent = await fs.readFile(SCORING_STATS_PATH, 'utf-8');
        
        // 3. Lưu nội dung vào biến cache
        scoringCache = JSON.parse(scoringStatsContent);

        console.log('✅ Dữ liệu điểm đã được nạp vào Scoring Service cache thành công.');
    } catch (error) {
        console.error(`❌ Lỗi khi nạp dữ liệu thống kê điểm vào cache:`, error);
        // Nếu có lỗi, đặt cache thành null để tránh phục vụ dữ liệu cũ/sai
        scoringCache = null;
    }
};

/**
 * Lấy dữ liệu thống kê điểm từ cache.
 * @returns {Object | null} Dữ liệu thống kê điểm hoặc null nếu chưa có.
 */
const getScoringStats = () => {
    return scoringCache;
};

/**
 * Xóa cache của service này bằng cách đặt lại biến.
 */
const clearCache = () => {
    scoringCache = null;
    console.log('[CACHE] Cache của Scoring Service đã được xóa.');
};

module.exports = {
    loadScoringStatistics,
    getScoringStats,
    clearCache
};