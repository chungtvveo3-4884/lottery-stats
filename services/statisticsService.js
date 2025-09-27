const fs = require('fs').promises;
const path = require('path');

const NUMBER_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'number_stats.json');
const HEAD_TAIL_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'head_tail_stats.json');
const SUM_DIFFERENCE_STATS_PATH = path.join(__dirname, '..', 'data', 'statistics', 'sum_difference_stats.json');
const RAW_DATA_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');

let cachedStats = null;
let latestDate = null;

/**
 * Đọc và hợp nhất dữ liệu từ tất cả các file thống kê.
 */
async function getStatsData() {
    // 1. Kiểm tra cache trước tiên
    if (cachedStats) {
        console.log('[CACHE] Sử dụng dữ liệu statistic từ cache.');
        return cachedStats;
    }

    // 2. Nếu cache trống, đọc file và tạo cache mới
    try {
        console.log('[CACHE] Cache trống, đang đọc dữ liệu thống kê từ file...');
        const [numberStatsRaw, headTailStatsRaw, sumDiffStatsRaw] = await Promise.all([
            fs.readFile(NUMBER_STATS_PATH, 'utf-8').catch(() => '{}'),
            fs.readFile(HEAD_TAIL_STATS_PATH, 'utf-8').catch(() => '{}'),
            fs.readFile(SUM_DIFFERENCE_STATS_PATH, 'utf-8').catch(() => '{}')
        ]);
        
        const numberStats = JSON.parse(numberStatsRaw);
        const headTailStats = JSON.parse(headTailStatsRaw);
        const sumDiffStats = JSON.parse(sumDiffStatsRaw);

        // Nạp dữ liệu vào cache
        cachedStats = { ...numberStats, ...headTailStats, ...sumDiffStats }; 
        console.log('[CACHE] Đã nạp thành công dữ liệu statistic mới vào cache.');
        return cachedStats;

    } catch (error) {
        console.error('Lỗi khi đọc hoặc phân tích file thống kê:', error);
        return {}; // Trả về đối tượng rỗng nếu có lỗi
    }
}

// === HÀM MỚI ĐỂ XÓA CACHE ===
function clearCache() {
    console.log('[CACHE] Xóa cache thống kê...');
    cachedStats = null;
    latestDate = null;
};

/**
 * Lấy ngày mới nhất từ dữ liệu gốc
 */
async function getLatestDate() {
    if (latestDate && process.env.NODE_ENV !== 'development') {
        return latestDate;
    }
    try {
        const rawData = await fs.readFile(RAW_DATA_PATH, 'utf-8');
        const data = JSON.parse(rawData);
        // Giả sử dữ liệu đã được sắp xếp hoặc bản ghi cuối cùng là mới nhất
        const lastEntry = data[data.length - 1];
        if (lastEntry && lastEntry.date) {
            const d = new Date(lastEntry.date);
            latestDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            return latestDate;
        }
        return null;
    } catch (error) {
        console.error('Không thể đọc ngày mới nhất:', error);
        return null;
    }
}


/**
 * Hàm tiện ích để chuyển đổi chuỗi ngày 'dd/mm/yyyy' thành đối tượng Date
 */
function parseDate(dateString) {
    if(!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    // new Date(year, monthIndex, day)
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

/**
 * Lấy và lọc các chuỗi thống kê
 */
async function getFilteredStreaks(category, subcategory, filters = {}) {
    const allStats = await getStatsData();
    let statsData;
    let finalStreaks = []; // Khai báo ở đây để đảm bảo luôn tồn tại

    if (subcategory && allStats[category] && allStats[category][subcategory]) {
        statsData = allStats[category][subcategory];
    } else if (allStats[category]) {
        statsData = allStats[category];
    }

    if (!statsData || !statsData.streaks) {
        return { description: 'Không tìm thấy dữ liệu', streaks: [] };
    }

    finalStreaks = statsData.streaks;

    if (filters.startDate) {
        const start = parseDate(filters.startDate);
        if(start) finalStreaks = finalStreaks.filter(s => parseDate(s.startDate) >= start);
    }
    if (filters.endDate) {
        const end = parseDate(filters.endDate);
        if(end) finalStreaks = finalStreaks.filter(s => parseDate(s.endDate) <= end);
    }
    if (filters.minLength && filters.minLength !== 'all') {
        // === SỬA LỖI CHÍNH TẠI ĐÂY ===
        // Thay đổi toán tử so sánh từ >= thành == để lọc chính xác.
        finalStreaks = finalStreaks.filter(s => s.length == filters.minLength);
    }
    
    return {
        description: statsData.description,
        streaks: finalStreaks
    };
};


/**
 * Lấy dữ liệu cho phần Thống kê kỷ lục
 */
async function getQuickStats() {
    const allStats = await getStatsData();
    const quickStats = {};
    latestDate = await getLatestDate();

    const analyzeCategory = (key, categoryData) => {
        if (!categoryData || !Array.isArray(categoryData.streaks) || categoryData.streaks.length === 0) {
            return;
        }

        const streaks = [...categoryData.streaks].sort((a, b) => b.length - a.length);
        const longest = streaks.filter(s => s.length === streaks[0].length);
        
        let secondLongest = [];
        const longestLength = longest[0].length;
        for(let i=0; i < streaks.length; i++){
            if(streaks[i].length < longestLength){
                const secondLength = streaks[i].length;
                secondLongest = streaks.filter(s => s.length === secondLength);
                break;
            }
        }
        
        const current = latestDate ? categoryData.streaks.find(s => s.endDate === latestDate) : null;

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
            longest,
            secondLongest,
            current,
            averageInterval,
            daysSinceLast
        };
    };

    for (const key in allStats) {
        const categoryData = allStats[key];
        if (categoryData.streaks) { // Cấu trúc đơn
            analyzeCategory(key, categoryData);
        } else { // Cấu trúc lồng
            for (const subKey in categoryData) {
                analyzeCategory(`${key}:${subKey}`, categoryData[subKey]);
            }
        }
    }

    return quickStats;
};

/**
 * Lấy toàn bộ dữ liệu thống kê, sử dụng cache nếu có.
 */
async function getAllStreaks() {
    if (!cachedStats) {
        await getStatsData();
    }
    return cachedStats;
}

/**
 * Lấy các chuỗi đang diễn ra gần đây.
 */
async function getRecentStreaks(days = 30) {
    const allStreaks = await getAllStreaks();
    const recentStreaks = { streaks: {} };

    for (const key in allStreaks) {
        const streakInfo = allStreaks[key];
        if (streakInfo.current) {
            const currentLength = streakInfo.current.length;
            if (!recentStreaks.streaks[currentLength]) {
                recentStreaks.streaks[currentLength] = [];
            }
            recentStreaks.streaks[currentLength].push({
                statName: key,
                statDescription: streakInfo.description,
                details: [streakInfo.current] 
            });
        }
    }
    return recentStreaks;
}

/**
 * Lấy thống kê chi tiết cho một loại chuỗi với độ dài cụ thể.
 * (Hàm đã được cải tiến để ổn định hơn)
 */
async function getStreakStats(statName, exactLength) {
    try {
        const allStreaks = await getAllStreaks();
        const streakData = allStreaks[statName];
        
        if (!streakData || !streakData.streaks) {
            return { runs: [] };
        }

        const runs = streakData.streaks
            .filter(streak => streak.length === exactLength)
            .map(streak => ({ date: streak.startDate })); // Lấy ngày bắt đầu của chuỗi

        // Sắp xếp các lần chạy theo ngày để tính toán cho chính xác
        return {
            runs: runs.sort((a, b) => new Date(a.date) - new Date(b.date)),
        };
    } catch (error) {
        console.error(`Lỗi khi lấy getStreakStats cho ${statName}:`, error);
        return { runs: [] }; // Trả về mảng rỗng nếu có lỗi
    }
}

/**
 * Lấy kết quả xổ số của ngày gần nhất.
 */
async function getLatestLotteryResult() {
    try {
        const data = await fs.readFile(RAW_DATA_PATH, 'utf-8');
        const results = JSON.parse(data);
        // Sắp xếp để đảm bảo kết quả cuối cùng là mới nhất
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
        return results[0]; // Trả về kết quả của ngày gần nhất
    } catch (error) {
        console.error('Lỗi khi đọc file dữ liệu kết quả xổ số:', error);
        return null;
    }
}

module.exports = {
    getStatsData,
    getFilteredStreaks,
    getQuickStats,
    clearCache,
    getAllStreaks,
    getRecentStreaks,
    getLatestLotteryResult, // <-- ĐÃ THÊM VÀO EXPORT
    getStreakStats // Thêm dòng này
};