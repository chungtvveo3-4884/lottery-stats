// services/statsCacheService.js

const lotteryService = require('./lotteryService'); // Phụ thuộc vào các hàm thống kê riêng lẻ
const { findEvenOddSumSequences, findSoleSumSequences } = require('../utils/lotteryAnalyzerSumSequences');
const { findSpecificSumRangeSequences } = require('../utils/sumRangeAnalyzer');
const { findTraditionalSumRangeSequences } = require('../utils/traditionalSumRangeAnalyzer');

// Đây là statFunctionsMap đã được chuyển từ controller sang đây
const statFunctionsMap = {
    // Dán toàn bộ nội dung của statFunctionsMap đầy đủ mà chúng ta đã tạo ở lần trước vào đây
    'consecutivePairs': (data, start, end, days) => lotteryService.findConsecutivePairs(data, start, end, 'de', days),
    'consecutiveHeads': (data, start, end, days) => lotteryService.findConsecutiveNumbers(data, start, end, 'head', 'de', days),
    // ... và tất cả các hàm khác
};

// Hàm chính để chạy và cache lại toàn bộ thống kê
const runAndCacheOverallStats = async (data) => {
    console.log('[CACHE] Bắt đầu chạy tính toán thống kê tổng hợp...');
    if (!data || data.length === 0) {
        console.log('[CACHE] Dữ liệu rỗng, không thể tính toán.');
        return null;
    }

    try {
        const overallLongestRuns = {};
        const startDate = lotteryService.getEarliestDate(data);
        const endDate = lotteryService.getCurrentDate();
        const allDatesInChronologicalOrder = data.map(d => d.date);

        // Lặp qua từng loại thống kê để tìm kỷ lục
        for (const [statName, statFunctionWrapper] of Object.entries(statFunctionsMap)) {
            // Logic lặp tăng dần số ngày (logic của bạn)
            let lastSuccessfulResults = [];
            let longestLength = 0;
            for (let n = 2; n <= 40; n++) {
                const { results } = statFunctionWrapper(data, startDate, endDate, n);
                if (results && results.length > 0) {
                    lastSuccessfulResults = results;
                    longestLength = n;
                } else {
                    break;
                }
            }

            // Xử lý kết quả cuối cùng tìm được
            if (longestLength > 0) {
                const mostRecentRun = lastSuccessfulResults.reduce((latest, current) => (new Date(current.dates[0]) > new Date(latest.dates[0]) ? current : latest));
                overallLongestRuns[statName] = {
                    length: longestLength,
                    startDate: mostRecentRun.dates[0],
                    endDate: mostRecentRun.dates[mostRecentRun.dates.length - 1],
                    matchingNumbers: Array.isArray(mostRecentRun.numbers) ? mostRecentRun.numbers : [mostRecentRun.number],
                    detailedResults: mostRecentRun.results || []
                };
            } else {
                overallLongestRuns[statName] = { length: 0, startDate: null, endDate: null, matchingNumbers: [], detailedResults: [] };
            }
        }
        
        // Phân tích chuỗi nóng
        const recentStreaksData = lotteryService.analyzeCurrentStreaks(data, statFunctionsMap);

        console.log('[CACHE] Tính toán thống kê tổng hợp thành công!');
        return {
            overallLongestRuns,
            recentStreaks: recentStreaksData,
        };

    } catch (error) {
        console.error('[CACHE] Lỗi nghiêm trọng khi đang chạy thống kê tổng hợp:', error);
        return null;
    }
};

module.exports = {
    runAndCacheOverallStats
};