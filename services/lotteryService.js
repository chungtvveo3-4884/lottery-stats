// services/lotteryService.js
const fs = require('fs').promises;
const path = require('path');

const RAW_DATA_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
let rawDataCache = null;

/**
 * Tải dữ liệu thô từ file JSON vào cache.
 */
const loadRawData = async () => {
    try {
        console.log('[LotteryService] Đang tải dữ liệu thô vào cache...');
        const rawDataContent = await fs.readFile(RAW_DATA_PATH, 'utf-8');
        rawDataCache = JSON.parse(rawDataContent);
        console.log(`[LotteryService] Đã tải thành công ${rawDataCache.length} bản ghi.`);
    } catch (error) {
        console.error('[LotteryService] Lỗi khi tải dữ liệu thô:', error);
        rawDataCache = []; // Đảm bảo cache là một mảng trống khi có lỗi
    }
};

/**
 * Lấy dữ liệu thô đã được cache.
 */
const getRawData = () => {
    return rawDataCache;
};

/**
 * Xóa cache dữ liệu thô.
 */
const clearCache = () => {
    rawDataCache = null;
    console.log('[LotteryService] Cache dữ liệu thô đã được xóa.');
};

module.exports = {
    loadRawData,
    getRawData,
    clearCache
};