// services/scoringStatsGenerator.js
const fs = require('fs').promises;
const path = require('path');
const lotteryScoring = require('../utils/lotteryScoring');

const RAW_DATA_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
const SCORING_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'scoring_stats.json');

// --- Các hàm tiện ích nội bộ ---

const _formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
};

const _getNumbersByMode = (dayData, mode = 'de') => {
    if (!dayData) return [];
    if (mode === 'lo') return dayData.numbers;
    if (mode === 'de') return dayData.de ? [dayData.de] : [];
    return [];
};

const _processRawData = async (startDate, endDate, mode) => {
    const rawDataContent = await fs.readFile(RAW_DATA_PATH, 'utf-8');
    const rawData = JSON.parse(rawDataContent);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filteredData = rawData.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
    });

    return filteredData.map(day => ({
        date: _formatDate(day.date),
        numbers: _getNumbersByMode(day, mode)
    }));
};

// --- Logic chính của Generator ---

/**
 * Tính toán và tạo file thống kê điểm tổng hợp.
 */
const generateScoringStats = async () => {
    try {
        console.log('🔄 Bắt đầu tạo file thống kê điểm tổng hợp...');
        
        const currentYear = new Date().getFullYear();
        const startDate = `${currentYear}-01-01`;
        const endDate = new Date().toISOString().split('T')[0];
        const mode = 'de';

        const processedData = await _processRawData(startDate, endDate, mode);
        const { results } = lotteryScoring.calculateAggregateScoreForAllNumbers(processedData);

        if (!results) {
             throw new Error('Tính toán điểm tổng hợp không trả về kết quả.');
        }

        const stats = {
            aggStartDate: _formatDate(startDate),
            aggEndDate: _formatDate(endDate),
            aggMode: mode.toUpperCase(),
            results,
            scoringForms: lotteryScoring.scoringForms,
            lastUpdated: new Date().toISOString()
        };

        await fs.writeFile(SCORING_STATS_PATH, JSON.stringify(stats, null, 2));
        console.log(`✅ Đã tạo file thống kê điểm tại: ${SCORING_STATS_PATH}`);
        
    } catch (error) {
        console.error('❌ Lỗi nghiêm trọng khi tạo file thống kê điểm:', error);
    }
};

module.exports = {
    generateScoringStats
};