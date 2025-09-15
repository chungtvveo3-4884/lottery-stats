const fs = require('fs').promises;
const path = require('path');

const STATS_FILE_PATH = path.join(__dirname, '..', 'data', 'statistics', 'number_stats.json');
const RAW_DATA_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');


let cachedStats = null;
let latestDate = null;

/**
 * Đọc và cache dữ liệu thống kê từ file number_stats.json
 */
async function getStatsData() {
    if (cachedStats && process.env.NODE_ENV !== 'development') {
        return cachedStats;
    }
    try {
        const rawData = await fs.readFile(STATS_FILE_PATH, 'utf-8');
        cachedStats = JSON.parse(rawData);
        return cachedStats;
    } catch (error) {
        console.error('Lỗi không đọc được file thống kê. Hãy chạy statisticsGenerator.js trước.', error);
        return {};
    }
}

/**
 * Lấy ngày mới nhất từ dữ liệu gốc để xác định chuỗi hiện tại
 */
async function getLatestDate() {
     if (latestDate && process.env.NODE_ENV !== 'development') {
        return latestDate;
    }
    try {
        const rawData = await fs.readFile(RAW_DATA_PATH, 'utf-8');
        const data = JSON.parse(rawData)
            .filter(item => item.special !== null && !isNaN(item.special))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (data.length > 0) {
            const date = new Date(data[0].date);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            latestDate = `${day}/${month}/${year}`;
        }
        return latestDate;
    } catch(e) {
        console.error("Lỗi khi đọc dữ liệu gốc để lấy ngày mới nhất:", e);
        return null;
    }
}

/**
 * Hàm tiện ích để chuyển đổi ngày DD/MM/YYYY sang đối tượng Date
 */
function parseDate(dateString) {
    if(!dateString) return null;
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
}

/**
 * Lấy và lọc các chuỗi thống kê theo yêu cầu từ người dùng.
 */
async function getFilteredStreaks(categoryKey, subCategoryKey = null, filters = {}) {
    const allStats = await getStatsData();
    let data;

    if (subCategoryKey) {
        data = allStats[categoryKey] ? allStats[categoryKey][subCategoryKey] : null;
    } else {
        data = allStats[categoryKey];
    }

    if (!data || !data.streaks) {
        return { description: 'Không tìm thấy dữ liệu', streaks: [] };
    }

    let filteredStreaks = data.streaks;

    if (filters.startDate) {
        const startDate = parseDate(filters.startDate);
        filteredStreaks = filteredStreaks.filter(streak => parseDate(streak.startDate) >= startDate);
    }

    if (filters.endDate) {
        const endDate = parseDate(filters.endDate);
        filteredStreaks = filteredStreaks.filter(streak => parseDate(streak.endDate) <= endDate);
    }
    
    if (filters.exactLength && filters.exactLength !== 'all' && filters.exactLength !== '') {
        const length = parseInt(filters.exactLength, 10);
        filteredStreaks = filteredStreaks.filter(streak => streak.length === length);
    }


    filteredStreaks.sort((a, b) => {
        if (b.length !== a.length) {
            return b.length - a.length;
        }
        return parseDate(b.startDate) - parseDate(a.startDate);
    });

    return {
        description: data.description,
        streaks: filteredStreaks
    };
}

/**
 * Lấy dữ liệu thống kê nhanh: kỷ lục, dài nhì và chuỗi hiện tại cho tất cả các loại.
 */
async function getQuickStats() {
    const allStats = await getStatsData();
    const latestDateValue = await getLatestDate();
    const quickStats = {};

    if (!latestDateValue) {
        console.log("Không thể xác định ngày mới nhất, thống kê nhanh có thể không chính xác.");
    }

    for (const categoryKey in allStats) {
        const category = allStats[categoryKey];
        if (category.description && Array.isArray(category.streaks)) {
            processCategory(category, categoryKey, quickStats, latestDateValue);
        } else { 
            for(const subCategoryKey in category){
                const subCategory = category[subCategoryKey];
                if(subCategory.description && Array.isArray(subCategory.streaks)) {
                    const compositeKey = `${categoryKey}-${subCategoryKey}`;
                    processCategory(subCategory, compositeKey, quickStats, latestDateValue);
                }
            }
        }
    }
    return quickStats;
}

/**
 * Hàm trợ giúp cho getQuickStats để xử lý từng danh mục
 */
function processCategory(categoryData, key, quickStats, latestDate) {
    if (!categoryData || !Array.isArray(categoryData.streaks) || categoryData.streaks.length === 0) {
         quickStats[key] = {
            description: categoryData.description || "N/A",
            longest: [], secondLongest: [], current: null,
            averageInterval: null, daysSinceLast: null
        };
        return;
    }
    
    const sortedByLength = [...categoryData.streaks].sort((a, b) => b.length - a.length);

    const longestLength = sortedByLength[0].length;
    const allLongest = sortedByLength.filter(s => s.length === longestLength);

    const remainingStreaks = sortedByLength.filter(s => s.length < longestLength);
    let allSecondLongest = [];
    if (remainingStreaks.length > 0) {
        const secondLongestLength = remainingStreaks[0].length;
        allSecondLongest = remainingStreaks.filter(s => s.length === secondLongestLength);
    }
    
    // --- Bổ sung logic tính toán mới ---
    const sortedByDate = [...categoryData.streaks].sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate));
    let averageInterval = null;
    let daysSinceLast = null;

    // Tính chu kỳ trung bình
    if (sortedByDate.length > 1) {
        let totalDaysBetween = 0;
        for (let i = 0; i < sortedByDate.length - 1; i++) {
            const endDate = parseDate(sortedByDate[i].endDate);
            const nextStartDate = parseDate(sortedByDate[i + 1].startDate);
            const diffTime = Math.abs(nextStartDate - endDate);
            totalDaysBetween += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        averageInterval = Math.round(totalDaysBetween / (sortedByDate.length - 1));
    }

    // Tính số ngày kể từ lần cuối xuất hiện
    if (latestDate && sortedByDate.length > 0) {
        const lastStreakEndDate = parseDate(sortedByDate[sortedByDate.length - 1].endDate);
        const latestLotteryDate = parseDate(latestDate);
        const diffTime = Math.abs(latestLotteryDate - lastStreakEndDate);
        daysSinceLast = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const currentStreak = latestDate ? categoryData.streaks.find(s => s.endDate === latestDate) : null;

    quickStats[key] = {
        description: categoryData.description,
        longest: allLongest,
        secondLongest: allSecondLongest,
        current: currentStreak || null,
        averageInterval: averageInterval,
        daysSinceLast: daysSinceLast
    };
}


module.exports = {
    getFilteredStreaks,
    getQuickStats
};