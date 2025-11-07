// services/lotteryService.js
const fs = require('fs').promises;
const path = require('path');

const RAW_DATA_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
const NUMBER_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'number_stats.json');
const HEAD_TAIL_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'head_tail_stats.json');
const SUM_DIFF_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'sum_difference_stats.json');

let rawDataCache = null;
let numberStatsCache = null;
let headTailStatsCache = null;
let sumDiffStatsCache = null;

async function loadJson(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Lỗi khi tải file ${filePath}:`, error.message);
        return null;
    }
}

const loadRawData = async () => {
    console.log('[LotteryService] Đang tải dữ liệu thô và thống kê vào cache...');
    
    // Tải song song các file
    [
        rawDataCache, 
        numberStatsCache, 
        headTailStatsCache, 
        sumDiffStatsCache
    ] = await Promise.all([
        loadJson(RAW_DATA_PATH),
        loadJson(NUMBER_STATS_PATH),
        loadJson(HEAD_TAIL_STATS_PATH),
        loadJson(SUM_DIFF_STATS_PATH)
    ]);
    
    if (rawDataCache) {
        console.log(`[LotteryService] Đã tải thành công ${rawDataCache.length} bản ghi kết quả.`);
    }
    if (numberStatsCache) {
        console.log('[LotteryService] Đã tải thành công number_stats.json.');
    }
    if (headTailStatsCache) {
        console.log('[LotteryService] Đã tải thành công head_tail_stats.json.');
    }
    if (sumDiffStatsCache) {
        console.log('[LotteryService] Đã tải thành công sum_difference_stats.json.');
    }
};

const getRawData = () => rawDataCache;
const getNumberStats = () => numberStatsCache;
const getHeadTailStats = () => headTailStatsCache;
const getSumDiffStats = () => sumDiffStatsCache;

const clearCache = () => {
    rawDataCache = null;
    numberStatsCache = null;
    headTailStatsCache = null;
    sumDiffStatsCache = null;
    console.log('[LotteryService] Cache đã được xóa.');
};

module.exports = {
    loadRawData,
    getRawData,
    getNumberStats,
    getHeadTailStats,
    getSumDiffStats,
    clearCache
};