const fs = require('fs').promises;
const path = require('path');

const NUMBER_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'number_stats.json');
const HEAD_TAIL_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'head_tail_stats.json');
const RAW_DATA_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');

let cachedStats = null;
let latestDate = null;

/**
 * Đọc và hợp nhất dữ liệu từ tất cả các file thống kê
 */
async function getStatsData() {
    if (cachedStats && process.env.NODE_ENV !== 'development') {
        return cachedStats;
    }
    try {
        const [numberStatsRaw, headTailStatsRaw] = await Promise.all([
            fs.readFile(NUMBER_STATS_PATH, 'utf-8').catch(() => '{}'), // Trả về chuỗi JSON rỗng nếu lỗi
            fs.readFile(HEAD_TAIL_STATS_PATH, 'utf-8').catch(() => '{}')
        ]);
        
        const numberStats = JSON.parse(numberStatsRaw);
        const headTailStats = JSON.parse(headTailStatsRaw);

        cachedStats = { ...numberStats, ...headTailStats }; // Hợp nhất hai đối tượng
        return cachedStats;
    } catch (error) {
        console.error('Lỗi khi đọc hoặc phân tích file thống kê:', error);
        return {}; 
    }
}


/**
 * Lấy ngày mới nhất từ dữ liệu gốc
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


function parseDate(dateString) {
    if(!dateString) return null;
    const [day, month, year] = dateString.split('/');
    // Handles both YYYY and YY date formats
    const fullYear = year.length === 4 ? year : (Number(year) < 50 ? `20${year}`: `19${year}`);
    return new Date(fullYear, month - 1, day);
}

async function getFilteredStreaks(categoryKey, subCategoryKey = null, filters = {}) {
    const allStats = await getStatsData();
    let data;

    if (subCategoryKey) {
        data = allStats[categoryKey] ? allStats[categoryKey][subCategoryKey] : null;
    } else {
        data = allStats[categoryKey];
    }
    
    // Xử lý trường hợp đặc biệt cho veLienTiep trong các nhóm phức hợp
    if (subCategoryKey === 'veLienTiep' && allStats[categoryKey] && allStats[categoryKey][subCategoryKey]) {
         data = allStats[categoryKey][subCategoryKey];
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

    filteredStreaks.sort((a, b) => parseDate(b.startDate) - parseDate(a.startDate));

    return {
        description: data.description,
        streaks: filteredStreaks
    };
}


async function getQuickStats() {
    const allStats = await getStatsData();
    const latestDateValue = await getLatestDate();
    const quickStats = {};

    if (!latestDateValue) {
        console.log("Không thể xác định ngày mới nhất, thống kê nhanh có thể không chính xác.");
    }

    for (const categoryKey in allStats) {
        const category = allStats[categoryKey];
        if (category.description && Array.isArray(category.streaks)) { // Cấp 1
            processCategory(category, categoryKey, quickStats, latestDateValue);
        } else { // Cấp 2 (ví dụ: chanChan)
            for(const subCategoryKey in category){
                const subCategory = category[subCategoryKey];
                if(subCategory && subCategory.description && Array.isArray(subCategory.streaks)) {
                    const compositeKey = `${categoryKey}-${subCategoryKey}`;
                    processCategory(subCategory, compositeKey, quickStats, latestDateValue);
                }
            }
        }
    }
    return quickStats;
}

function processCategory(categoryData, key, quickStats, latestDate) {
    if (!categoryData || !Array.isArray(categoryData.streaks) || categoryData.streaks.length === 0) {
         quickStats[key] = {
            description: categoryData.description || "N/A",
            longest: [], secondLongest: [], current: null, averageInterval: 0, daysSinceLast: 'N/A'
        };
        return;
    }
    
    const sortedStreaks = [...categoryData.streaks].sort((a, b) => b.length - a.length);

    const longestLength = sortedStreaks[0].length;
    const allLongest = sortedStreaks.filter(s => s.length === longestLength);

    const remainingStreaks = sortedStreaks.filter(s => s.length < longestLength);
    let allSecondLongest = [];
    if (remainingStreaks.length > 0) {
        const secondLongestLength = remainingStreaks[0].length;
        allSecondLongest = remainingStreaks.filter(s => s.length === secondLongestLength);
    }

    const currentStreak = latestDate ? categoryData.streaks.find(s => s.endDate === latestDate) : null;

    const streaksByDate = [...categoryData.streaks].sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate));
    let totalInterval = 0;
    let daysSinceLast = 'N/A';

    if (streaksByDate.length > 1) {
        for (let i = 1; i < streaksByDate.length; i++) {
            const prevEndDate = parseDate(streaksByDate[i - 1].endDate);
            const currStartDate = parseDate(streaksByDate[i].startDate);
            const diffTime = Math.abs(currStartDate - prevEndDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalInterval += diffDays;
        }
    }
    
    const averageInterval = streaksByDate.length > 1 ? Math.round(totalInterval / (streaksByDate.length - 1)) : 0;
    
    if (latestDate && streaksByDate.length > 0) {
        const lastStreakEndDate = parseDate(streaksByDate[streaksByDate.length - 1].endDate);
        const today = parseDate(latestDate);
        if(today && lastStreakEndDate){
            const diffTime = Math.abs(today - lastStreakEndDate);
            daysSinceLast = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
    }


    quickStats[key] = {
        description: categoryData.description,
        longest: allLongest,
        secondLongest: allSecondLongest,
        current: currentStreak || null,
        averageInterval,
        daysSinceLast
    };
}

module.exports = {
    getFilteredStreaks,
    getQuickStats
};

