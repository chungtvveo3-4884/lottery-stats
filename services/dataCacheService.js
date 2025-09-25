const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');

let cachedData = [];

/**
 * Đọc file dữ liệu thô, sắp xếp và lưu vào biến cache.
 */
const loadAndCacheData = () => {
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(rawData);
        
        // Sắp xếp để đảm bảo dữ liệu mới nhất luôn ở trên cùng
        jsonData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        cachedData = jsonData;
        console.log('[CACHE] Dữ liệu đã được tải và làm mới vào cache.');
    } catch (error) {
        console.error('[CACHE] Lỗi khi tải dữ liệu vào cache:', error);
        cachedData = []; // Đảm bảo cache trống nếu có lỗi
    }
};

/**
 * Lấy dữ liệu từ cache. Nếu cache rỗng, tải lại từ file.
 */
const getCachedData = () => {
    if (cachedData.length === 0) {
        loadAndCacheData();
    }
    return cachedData;
};

// Tải dữ liệu lần đầu tiên khi module được gọi
loadAndCacheData();

module.exports = {
    loadAndCacheData,
    getCachedData
};