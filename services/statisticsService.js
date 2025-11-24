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
 * Lấy kết quả xổ số gần đây (mặc định 7 ngày)
 */
async function getRecentResults(limit = 7) {
    try {
        const rawData = await fs.readFile(RAW_DATA_PATH, 'utf-8');
        const data = JSON.parse(rawData);

        // Lấy N ngày cuối cùng (theo thứ tự thời gian)
        const recentData = data.slice(-limit);
        return recentData;
    } catch (error) {
        console.error('Lỗi khi lấy kết quả gần đây:', error);
        return [];
    }
}


/**
 * Hàm tiện ích để chuyển đổi chuỗi ngày 'dd/mm/yyyy' thành đối tượng Date
 */
function parseDate(dateString) {
    if (!dateString) return null;
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
        if (start) finalStreaks = finalStreaks.filter(s => parseDate(s.startDate) >= start);
    }
    if (filters.endDate) {
        const end = parseDate(filters.endDate);
        if (end) finalStreaks = finalStreaks.filter(s => parseDate(s.endDate) <= end);
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
    const today = latestDate ? parseDate(latestDate) : new Date();

    const analyzeCategory = (key, categoryData) => {
        if (!categoryData || !Array.isArray(categoryData.streaks) || categoryData.streaks.length === 0) {
            return;
        }

        const streaks = [...categoryData.streaks].sort((a, b) => b.length - a.length);
        const longest = streaks.filter(s => s.length === streaks[0].length);

        let secondLongest = [];
        const longestLength = longest[0].length;
        for (let i = 0; i < streaks.length; i++) {
            if (streaks[i].length < longestLength) {
                const secondLength = streaks[i].length;
                secondLongest = streaks.filter(s => s.length === secondLength);
                break;
            }
        }

        // Xác định chuỗi hiện tại (đang diễn ra)
        let current = null;
        if (latestDate) {
            const isSoLe = key.toLowerCase().includes('sole');
            if (isSoLe) {
                // Với so le: Chỉ lấy chuỗi có endDate = latestDate - 1 (ngày hôm qua)
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;

                const streak = categoryData.streaks.find(s => s.endDate === yesterdayStr);
                if (streak) {
                    // Thêm kết quả ngày hôm nay vào fullSequence để hiển thị
                    current = { ...streak };
                    // Lấy dữ liệu số của ngày hôm nay
                    const lotteryService = require('./lotteryService');
                    const rawData = lotteryService.getRawData();
                    if (rawData && rawData.length > 0) {
                        const latestDayData = rawData.find(d => d.date === latestDate);
                        if (latestDayData && latestDayData.special) {
                            // Thêm vào fullSequence
                            if (!current.fullSequence) current.fullSequence = [];
                            current.fullSequence.push({
                                date: latestDate,
                                value: latestDayData.special,
                                isLatest: true // Đánh dấu là ngày mới nhất
                            });
                        }
                    }
                }
            } else {
                // Với dạng khác: Chuỗi đang diễn ra = kết thúc đúng ngày mới nhất
                current = categoryData.streaks.find(s => s.endDate === latestDate);
            }
        }

        // Tính toán khoảng cách trung bình chung (như cũ)
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
            if (today && lastStreakEndDate) {
                const diffTime = Math.abs(today - lastStreakEndDate);
                daysSinceLast = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        // === TÍNH TOÁN GAP STATS CHI TIẾT CHO TỪNG ĐỘ DÀI ===
        const gapStats = {};
        const maxLen = longestLength > 0 ? longestLength : 0;
        const calcLimit = maxLen + 1;

        // Detect if this is a "so le" pattern
        const isSoLePattern = key.includes('veSole') || key.includes('veSoleMoi');

        for (let len = 2; len <= calcLimit; len++) {
            // CHỈ lấy các chuỗi có độ dài CHÍNH XÁC = len (không phải >= len)
            const exactStreaks = categoryData.streaks
                .filter(s => s.length === len)
                .sort((a, b) => parseDate(a.endDate) - parseDate(b.endDate));

            if (exactStreaks.length < 2) {
                let lastGap = 0;
                if (exactStreaks.length === 1) {
                    const lastEnd = parseDate(exactStreaks[0].endDate);
                    if (exactStreaks[0].endDate !== latestDate) {
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        lastGap = Math.ceil((tomorrow - lastEnd) / 86400000);
                    }
                }
                gapStats[len] = { avgGap: 0, lastGap, minGap: null, count: exactStreaks.length, pastCount: exactStreaks.length };
                continue;
            }

            // Calculate individual gaps between consecutive streaks
            const gaps = [];
            for (let i = 0; i < exactStreaks.length - 1; i++) {
                const gap = Math.ceil((parseDate(exactStreaks[i + 1].endDate) - parseDate(exactStreaks[i].endDate)) / 86400000);
                gaps.push(gap);
            }

            // Filter gaps based on pattern type to exclude consecutive streaks
            let filteredGaps;
            if (isSoLePattern) {
                // For so le: exclude gaps <= 2 (consecutive streaks that should be merged)
                filteredGaps = gaps.filter(g => g > 2);
            } else {
                // For regular patterns: exclude gap = 1 (consecutive streaks)
                filteredGaps = gaps.filter(g => g > 1);
            }

            // Calculate avgGap and minGap
            const avgGap = filteredGaps.length > 0
                ? Math.round(filteredGaps.reduce((sum, g) => sum + g, 0) / filteredGaps.length)
                : 0;
            const minGap = filteredGaps.length > 0 ? Math.min(...filteredGaps) : null;

            // Tính lastGap: Từ chuỗi cuối cùng (không tính chuỗi hiện tại) đến NGÀY MAI
            let lastGap = 0;
            const pastStreaks = exactStreaks.filter(s => s.endDate !== latestDate);

            if (pastStreaks.length > 0) {
                const lastPastStreak = pastStreaks[pastStreaks.length - 1];
                const lastPastEnd = parseDate(lastPastStreak.endDate);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                lastGap = Math.ceil((tomorrow - lastPastEnd) / 86400000);
            } else {
                lastGap = 0;
            }

            gapStats[len] = { avgGap, lastGap, minGap, count: exactStreaks.length, pastCount: pastStreaks.length };
        }

        quickStats[key] = {
            description: categoryData.description,
            longest,
            secondLongest,
            current,
            averageInterval,
            daysSinceLast,
            gapStats
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
    getRecentResults,
    getLatestLotteryResult, // <-- ĐÃ THÊM VÀO EXPORT
    getStreakStats, // Thêm dòng này
    getLatestDate // Add this line
};