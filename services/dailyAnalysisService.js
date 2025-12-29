// services/dailyAnalysisService.js
const fs = require('fs').promises;
const path = require('path');
const lotteryService = require('./lotteryService');
const statisticsService = require('./statisticsService');
const { calculateBetAmount, calculateWinLoss } = require('./simulationService');
const exclusionService = require('./exclusionService');
const unifiedPrediction = require('./unifiedPredictionService');
const advancedAnalysis = require('./advancedAnalysisService');
const hybridAIPrediction = require('./hybridAIPredictionService');

const PREDICTIONS_PATH = path.join(__dirname, '..', 'data', 'predictions.json');

async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        if (data.trim() === '') return [];
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { return []; }
        throw error;
    }
}

async function checkAndUpdateHistory() {
    console.log('[Daily Analysis] === BẮT ĐẦU ĐỐI CHIẾU LỊCH SỬ ===');
    let predictions = await readJsonFile(PREDICTIONS_PATH);
    if (predictions.length === 0) {
        console.log('[Daily Analysis] File dự đoán trống. Bỏ qua.');
        return;
    }

    const rawData = lotteryService.getRawData();
    if (!rawData || rawData.length === 0) {
        console.error('[Daily Analysis] LỖI: Cache dữ liệu xổ số trống.');
        return;
    }

    const latestResult = rawData[rawData.length - 1];
    const latestDateStr = latestResult.date.substring(0, 10);
    console.log(`[Daily Analysis] Kết quả mới nhất trong CSDL: ${latestDateStr}, số về: ${latestResult.special}`);

    const predictionToUpdate = predictions.find(p => p.date === latestDateStr && !p.result);

    if (predictionToUpdate) {
        console.log(`[Daily Analysis] >>> TÌM THẤY dự đoán cần cập nhật cho ngày ${latestDateStr}.`);
        const winningNumber = latestResult.special.toString().padStart(2, '0');

        const lastPredictionIndex = predictions.findIndex(p => p.date === latestDateStr) - 1;
        const totalLossSoFar = lastPredictionIndex >= 0 ? (predictions[lastPredictionIndex].result?.totalLossToDate || 0) : 0;
        const totalLossSoFarUnified = lastPredictionIndex >= 0 ? (predictions[lastPredictionIndex].resultUnified?.totalLossToDate || 0) : 0;
        const totalLossSoFarAdvanced = lastPredictionIndex >= 0 ? (predictions[lastPredictionIndex].resultAdvanced?.totalLossToDate || 0) : 0;

        // ========== PHƯƠNG PHÁP 1: EXCLUSION ==========
        if (predictionToUpdate.danh && predictionToUpdate.danh.numbers && predictionToUpdate.danh.numbers.length > 0) {
            const betAmount = predictionToUpdate.betAmount;
            const calculation = calculateWinLoss(predictionToUpdate.danh.numbers, winningNumber, betAmount, totalLossSoFar);
            predictionToUpdate.result = {
                winningNumber,
                totalBet: calculation.totalBet,
                winAmount: calculation.winAmount,
                profit: calculation.profit,
                totalLossToDate: calculation.totalLossToDate,
                isWin: calculation.isWin
            };
        } else {
            predictionToUpdate.result = { winningNumber, totalBet: 0, winAmount: 0, profit: 0, totalLossToDate: totalLossSoFar, isWin: false, skipped: true };
        }

        // ========== PHƯƠNG PHÁP 2: UNIFIED ==========
        if (predictionToUpdate.danhUnified && predictionToUpdate.danhUnified.numbers && predictionToUpdate.danhUnified.numbers.length > 0) {
            const betAmountUnified = predictionToUpdate.betAmountUnified || 10;
            const calcUnified = calculateWinLoss(predictionToUpdate.danhUnified.numbers, winningNumber, betAmountUnified, totalLossSoFarUnified);
            predictionToUpdate.resultUnified = {
                winningNumber,
                totalBet: calcUnified.totalBet,
                winAmount: calcUnified.winAmount,
                profit: calcUnified.profit,
                totalLossToDate: calcUnified.totalLossToDate,
                isWin: calcUnified.isWin
            };
            console.log(`[Daily Analysis] Unified: ${calcUnified.isWin ? 'THẮNG' : 'THUA'} (${winningNumber})`);
        }

        // ========== PHƯƠNG PHÁP 3: ADVANCED (13 methods) ==========
        if (predictionToUpdate.danhAdvanced && predictionToUpdate.danhAdvanced.numbers && predictionToUpdate.danhAdvanced.numbers.length > 0) {
            const betAmountAdvanced = predictionToUpdate.betAmountAdvanced || 10;
            const calcAdvanced = calculateWinLoss(predictionToUpdate.danhAdvanced.numbers, winningNumber, betAmountAdvanced, totalLossSoFarAdvanced);
            predictionToUpdate.resultAdvanced = {
                winningNumber,
                totalBet: calcAdvanced.totalBet,
                winAmount: calcAdvanced.winAmount,
                profit: calcAdvanced.profit,
                totalLossToDate: calcAdvanced.totalLossToDate,
                isWin: calcAdvanced.isWin
            };
            console.log(`[Daily Analysis] Advanced: ${calcAdvanced.isWin ? 'THẮNG' : 'THUA'} (${winningNumber})`);
        }

        // ========== PHƯƠNG PHÁP 4: HYBRID AI (Markov + Monte Carlo + ARIMA + Pattern) ==========
        const totalLossSoFarHybrid = lastPredictionIndex >= 0 ? (predictions[lastPredictionIndex].resultHybrid?.totalLossToDate || 0) : 0;
        if (predictionToUpdate.danhHybrid && predictionToUpdate.danhHybrid.numbers && predictionToUpdate.danhHybrid.numbers.length > 0) {
            const betAmountHybrid = predictionToUpdate.betAmountHybrid || 10;
            const calcHybrid = calculateWinLoss(predictionToUpdate.danhHybrid.numbers, winningNumber, betAmountHybrid, totalLossSoFarHybrid);
            predictionToUpdate.resultHybrid = {
                winningNumber,
                totalBet: calcHybrid.totalBet,
                winAmount: calcHybrid.winAmount,
                profit: calcHybrid.profit,
                totalLossToDate: calcHybrid.totalLossToDate,
                isWin: calcHybrid.isWin
            };
            console.log(`[Daily Analysis] Hybrid AI: ${calcHybrid.isWin ? 'THẮNG' : 'THUA'} (${winningNumber})`);
        }

        // ========== PHƯƠNG PHÁP 5: COMBINED (Tổng hợp cả 4 phương pháp) ==========
        const totalLossSoFarCombined = lastPredictionIndex >= 0 ? (predictions[lastPredictionIndex].resultCombined?.totalLossToDate || 0) : 0;
        if (predictionToUpdate.danhCombined && predictionToUpdate.danhCombined.numbers && predictionToUpdate.danhCombined.numbers.length > 0) {
            const betAmountCombined = predictionToUpdate.betAmountCombined || 10;
            const calcCombined = calculateWinLoss(predictionToUpdate.danhCombined.numbers, winningNumber, betAmountCombined, totalLossSoFarCombined);
            predictionToUpdate.resultCombined = {
                winningNumber,
                totalBet: calcCombined.totalBet,
                winAmount: calcCombined.winAmount,
                profit: calcCombined.profit,
                totalLossToDate: calcCombined.totalLossToDate,
                isWin: calcCombined.isWin
            };
            console.log(`[Daily Analysis] Combined: ${calcCombined.isWin ? 'THẮNG' : 'THUA'} (${winningNumber})`);
        }

        await fs.writeFile(PREDICTIONS_PATH, JSON.stringify(predictions, null, 2));
        console.log(`[Daily Analysis] >>> THÀNH CÔNG: Đã cập nhật kết quả cho ngày ${latestDateStr}.`);
    } else {
        console.log(`[Daily Analysis] Không tìm thấy dự đoán nào cần cập nhật cho ngày ${latestDateStr}.`);
    }
    console.log('[Daily Analysis] === KẾT THÚC ĐỐI CHIẾU ===');
}

async function analyzeAndSavePrediction() {
    console.log('[Daily Analysis] === BẮT ĐẦU PHÂN TÍCH CHO NGÀY TIẾP THEO ===');
    const rawData = lotteryService.getRawData();
    if (!rawData || rawData.length < 4) {
        console.log('[Daily Analysis] Không đủ dữ liệu.');
        return;
    }

    const historicalSpecials = rawData.map(d => d.special.toString().padStart(2, '0'));
    const latestResult = rawData[rawData.length - 1];
    const latestDateStr = latestResult.date.substring(0, 10);

    const [year, month, day] = latestDateStr.split('-').map(Number);
    const latestDate = new Date(Date.UTC(year, month - 1, day));
    latestDate.setUTCDate(latestDate.getUTCDate() + 1);
    const predictionDateStr = latestDate.toISOString().substring(0, 10);

    let predictions = await readJsonFile(PREDICTIONS_PATH);
    const existingIndex = predictions.findIndex(p => p.date === predictionDateStr);
    if (existingIndex !== -1) {
        console.log(`[Daily Analysis] Dự đoán cho ngày ${predictionDateStr} đã tồn tại. Sẽ ghi đè.`);
        // Remove existing prediction - will be replaced with new one
        predictions.splice(existingIndex, 1);
    }

    // Logic phân tích dựa trên loại trừ - ĐỒNG NHẤT với suggestionsController
    const globalStats = await statisticsService.getStatsData();
    console.log(`[Daily Analysis] Global Stats Keys: ${Object.keys(globalStats).length}`);

    // currentIndex là index của ngày cuối cùng có kết quả (để dự đoán cho ngày mai)
    const currentIndex = rawData.length - 1;
    console.log(`[Daily Analysis] Current Index: ${currentIndex}, Raw Data Length: ${rawData.length}`);

    // Sử dụng getExclusions với logic tier (đỏ, tím, cam, light_red) - ĐỒNG NHẤT với suggestionsController
    // exclusionService đã tự động điều chỉnh để đảm bảo 20-40 số đánh
    const excludedNumbers = await exclusionService.getExclusions(rawData, currentIndex, globalStats);
    console.log(`[Daily Analysis] Excluded Numbers Count: ${excludedNumbers.size}`);

    // Tạo dàn số đánh (Tất cả - Loại trừ)
    const allNumbers = Array.from({ length: 100 }, (_, k) => k.toString().padStart(2, '0'));
    let numbersBet = allNumbers.filter(n => !excludedNumbers.has(parseInt(n, 10)));

    // exclusionService đã tự động điều chỉnh để đạt 20-40 số đánh
    // Chỉ cảnh báo nếu vẫn nằm ngoài phạm vi (hiếm khi xảy ra)
    let isSkipped = false;

    if (numbersBet.length < 20 || numbersBet.length > 40) {
        console.log(`[Daily Analysis] WARNING: Bet count ${numbersBet.length} is outside 20-40 range`);
        // Không skip, vẫn tiếp tục với số đánh hiện tại
    }

    // ============ UNIFIED PREDICTION METHOD ============
    console.log('[Daily Analysis] Đang tạo dự đoán theo phương pháp Unified...');
    let unifiedNumbers = [];
    let unifiedExcluded = [];
    try {
        // Format date for unified prediction (DD/MM/YYYY)
        const [uYear, uMonth, uDay] = predictionDateStr.split('-');
        const unifiedDateStr = `${uDay}/${uMonth}/${uYear}`;

        const unifiedResult = await unifiedPrediction.getDailyPrediction({ targetDate: unifiedDateStr });

        // Top 25 số có điểm cao nhất để đánh (lấy từ allNumbers đã sorted)
        unifiedNumbers = unifiedResult.allNumbers.slice(0, 25).map(p => p.number);
        // Top 75 số có điểm thấp nhất để loại trừ
        unifiedExcluded = unifiedResult.allNumbers.slice(-75).reverse().map(p => p.number);

        console.log(`[Daily Analysis] Unified: ${unifiedNumbers.length} số đánh, ${unifiedExcluded.length} số loại trừ`);
    } catch (error) {
        console.error('[Daily Analysis] Lỗi khi tạo unified prediction:', error.message);
        // Fallback: sử dụng top 40 số từ distribution
        unifiedNumbers = [];
    }

    // ============ ADVANCED PREDICTION METHOD (13 phương pháp nâng cao) ============
    console.log('[Daily Analysis] Đang tạo dự đoán theo phương pháp Advanced (13 methods)...');
    let advancedNumbers = [];
    let advancedExcluded = [];
    try {
        const advancedResult = await advancedAnalysis.getDailyAdvancedPrediction({ topCount: 25, excludeCount: 75 });
        advancedNumbers = advancedResult.predictions;
        advancedExcluded = advancedResult.exclusions;
        console.log(`[Daily Analysis] Advanced: ${advancedNumbers.length} số đánh, ${advancedExcluded.length} số loại trừ`);
    } catch (error) {
        console.error('[Daily Analysis] Lỗi khi tạo advanced prediction:', error.message);
        advancedNumbers = [];
    }

    // ============ HYBRID AI PREDICTION METHOD (Markov + Monte Carlo + ARIMA + Pattern) ============
    console.log('[Daily Analysis] Đang tạo dự đoán theo phương pháp Hybrid AI...');
    let hybridNumbers = [];
    let hybridExcluded = [];
    try {
        const hybridResult = await hybridAIPrediction.getHybridPrediction({ topCount: 25, excludeCount: 75 });
        hybridNumbers = hybridResult.predictions;
        hybridExcluded = hybridResult.exclusions;
        console.log(`[Daily Analysis] Hybrid AI: ${hybridNumbers.length} số đánh, ${hybridExcluded.length} số loại trừ`);
    } catch (error) {
        console.error('[Daily Analysis] Lỗi khi tạo hybrid prediction:', error.message);
        hybridNumbers = [];
    }

    // ============ COMBINED PREDICTION METHOD (Tổng hợp cả 4 phương pháp) ============
    // Logic: Lấy Union của 4 PP, loại số có count >= 2, đánh số còn lại (count === 1)
    console.log('[Daily Analysis] Đang tạo dự đoán theo phương pháp Combined (tổng hợp 4 phương pháp)...');
    let combinedNumbers = [];
    let combinedExcluded = [];
    try {
        // Đếm số lần xuất hiện của mỗi số trong 4 phương pháp
        const countMap = new Map();

        // Khởi tạo tất cả số với count = 0
        for (let i = 0; i < 100; i++) {
            countMap.set(i.toString().padStart(2, '0'), 0);
        }

        // Đếm từ mỗi phương pháp
        [numbersBet, unifiedNumbers, advancedNumbers, hybridNumbers].forEach(methodNumbers => {
            methodNumbers.forEach(num => {
                const numStr = typeof num === 'string' ? num : String(num).padStart(2, '0');
                countMap.set(numStr, (countMap.get(numStr) || 0) + 1);
            });
        });

        // Lấy các số trong UNION (count >= 1) nhưng loại số trùng (count >= 2)
        // → Chỉ đánh số có count === 1 (xuất hiện trong đúng 1 phương pháp)
        combinedNumbers = Array.from(countMap.entries())
            .filter(entry => entry[1] === 1)
            .map(entry => entry[0])
            .sort();

        // Loại trừ = số không có trong union (count === 0) + số trùng (count >= 2)
        const allNumbers = Array.from({ length: 100 }, (_, k) => k.toString().padStart(2, '0'));
        combinedExcluded = allNumbers.filter(n => countMap.get(n) !== 1);

        console.log(`[Daily Analysis] Combined: ${combinedNumbers.length} số đánh (unique), ${combinedExcluded.length} số loại trừ`);
    } catch (error) {
        console.error('[Daily Analysis] Lỗi khi tạo combined prediction:', error.message);
        combinedNumbers = [];
    }

    const lastPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;
    const lastTotalLoss = lastPrediction?.result?.totalLossToDate || 0;
    // User yêu cầu "vẫn đánh 10000 VND với bước nhảy 5000". Logic calculateBetAmount hiện tại có thể khác.
    // Tuy nhiên, để nhất quán với simulation, ta nên dùng logic progressive của simulationService.
    // Nhưng dailyAnalysisService chạy độc lập mỗi ngày, state được lưu trong predictions.json.
    // 3. Tính tiền cược (Gấp thếp)
    // Cần lấy totalLossToDate từ ngày gần nhất CÓ KẾT QUẢ
    // Tìm ngày gần nhất có result
    let lastLoss = 0;
    let lastUnifiedLoss = 0;
    let lastAdvancedLoss = 0;
    for (let i = predictions.length - 1; i >= 0; i--) {
        if (predictions[i].result) {
            lastLoss = predictions[i].result.totalLossToDate || 0;
            lastUnifiedLoss = predictions[i].resultUnified?.totalLossToDate || 0;
            lastAdvancedLoss = predictions[i].resultAdvanced?.totalLossToDate || 0;
            break;
        }
    }

    const betAmount = calculateBetAmount(lastLoss);
    const betAmountUnified = calculateBetAmount(lastUnifiedLoss);
    const betAmountAdvanced = calculateBetAmount(lastAdvancedLoss);

    const newPrediction = {
        date: predictionDateStr,
        // Phương pháp 1: Exclusion (Chuỗi + Gap) - ĐỒNG NHẤT với /api/suggestions
        danh: {
            numbers: numbersBet, // Sử dụng biến đã check skip
            count: numbersBet.length,
            excluded: Array.from(excludedNumbers) // Danh sách số loại trừ
        },
        betAmount: betAmount,
        analysisDetails: {
            excludedCount: excludedNumbers.size,
            method: 'exclusion',
            description: 'Loại trừ dựa trên Chuỗi đang diễn ra và Gap Analysis (tier: đỏ, tím, cam, light_red)'
        },
        result: null, // Chưa có kết quả

        // Phương pháp 2: Unified (6 methods)
        danhUnified: {
            numbers: unifiedNumbers,
            count: unifiedNumbers.length,
            excluded: unifiedExcluded
        },
        betAmountUnified: betAmountUnified,
        analysisDetailsUnified: {
            method: 'unified',
            description: 'Kết hợp 6 phương pháp: Gap, Streak, Exclusion, Yearly, DayPattern, Recent'
        },
        resultUnified: null, // Chưa có kết quả

        // Phương pháp 3: Advanced (13 methods)
        danhAdvanced: {
            numbers: advancedNumbers,
            count: advancedNumbers.length,
            excluded: advancedExcluded
        },
        betAmountAdvanced: betAmountAdvanced,
        analysisDetailsAdvanced: {
            method: 'advanced',
            description: 'Kết hợp 13 phương pháp: Chi-Square, Z-Score, Poisson, Bayesian, Mean Reversion, MA, Momentum, Cycle, Markov, Fibonacci, Prime, Digit Sum, Modular'
        },
        resultAdvanced: null, // Chưa có kết quả

        // Phương pháp 4: Hybrid AI (Markov + Monte Carlo + ARIMA + Pattern)
        danhHybrid: {
            numbers: hybridNumbers,
            count: hybridNumbers.length,
            excluded: hybridExcluded
        },
        betAmountHybrid: calculateBetAmount(0), // Bắt đầu từ 0
        analysisDetailsHybrid: {
            method: 'hybrid',
            description: 'Kết hợp 4 phương pháp AI: Markov Chain, Monte Carlo, ARIMA Time Series, Pattern Recognition'
        },
        resultHybrid: null, // Chưa có kết quả

        // Phương pháp 5: Combined (Tổng hợp 4 phương pháp)
        danhCombined: {
            numbers: combinedNumbers,
            count: combinedNumbers.length,
            excluded: combinedExcluded
        },
        betAmountCombined: calculateBetAmount(0), // Bắt đầu từ 0
        analysisDetailsCombined: {
            method: 'combined',
            description: 'Tổng hợp cả 4 phương pháp: Exclusion, Unified, Advanced, Hybrid AI'
        },
        resultCombined: null // Chưa có kết quả
    };

    // Prediction was already removed from array if it existed (line 86-91)
    // So we just push the new one
    predictions.push(newPrediction);

    await fs.writeFile(PREDICTIONS_PATH, JSON.stringify(predictions, null, 2));
    console.log(`[Daily Analysis] Đã lưu dự đoán cho ngày ${predictionDateStr}.`);
    console.log('[Daily Analysis] === KẾT THÚC PHÂN TÍCH ===');
}

/**
 * [MỚI] Đồng bộ lại toàn bộ lịch sử dự đoán với kết quả thực tế
 * Được gọi khi khởi động server
 */
async function syncPredictionHistory() {
    console.log('[Daily Analysis] === BẮT ĐẦU ĐỒNG BỘ LỊCH SỬ ===');
    let predictions = await readJsonFile(PREDICTIONS_PATH);
    if (predictions.length === 0) {
        console.log('[Daily Analysis] Lịch sử trống.');
        return;
    }

    const rawData = lotteryService.getRawData();
    if (!rawData || rawData.length === 0) {
        console.log('[Daily Analysis] Chưa có dữ liệu xổ số để đồng bộ.');
        return;
    }

    // Map date -> special for fast lookup
    // rawData date is ISO string, we need YYYY-MM-DD
    const dateToResultMap = new Map(rawData.map(d => [d.date.substring(0, 10), d.special]));

    let totalLossSoFar = 0;
    let totalLossSoFarUnified = 0;
    let totalLossSoFarAdvanced = 0;
    let updatedCount = 0;

    // Sắp xếp predictions theo ngày tăng dần để tính lũy kế đúng
    predictions.sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i];
        const actualSpecial = dateToResultMap.get(pred.date);

        if (actualSpecial !== undefined) {
            // Có kết quả -> Tính toán lại
            const winningNumber = actualSpecial.toString().padStart(2, '0');

            // ========== PHƯƠNG PHÁP 1: EXCLUSION ==========
            if (pred.danh && pred.danh.numbers && pred.danh.numbers.length > 0) {
                const calculation = calculateWinLoss(pred.danh.numbers, winningNumber, pred.betAmount || 10, totalLossSoFar);
                pred.result = {
                    winningNumber,
                    totalBet: calculation.totalBet,
                    winAmount: calculation.winAmount,
                    profit: calculation.profit,
                    totalLossToDate: calculation.totalLossToDate,
                    isWin: calculation.isWin
                };
                totalLossSoFar = calculation.totalLossToDate;
            } else {
                // Ngày bỏ qua - không đánh
                pred.result = { winningNumber, totalBet: 0, winAmount: 0, profit: 0, totalLossToDate: totalLossSoFar, isWin: false, skipped: true };
            }

            // ========== PHƯƠNG PHÁP 2: UNIFIED ==========
            if (pred.danhUnified && pred.danhUnified.numbers && pred.danhUnified.numbers.length > 0) {
                const calcUnified = calculateWinLoss(pred.danhUnified.numbers, winningNumber, pred.betAmountUnified || 10, totalLossSoFarUnified);
                pred.resultUnified = {
                    winningNumber,
                    totalBet: calcUnified.totalBet,
                    winAmount: calcUnified.winAmount,
                    profit: calcUnified.profit,
                    totalLossToDate: calcUnified.totalLossToDate,
                    isWin: calcUnified.isWin
                };
                totalLossSoFarUnified = calcUnified.totalLossToDate;
            } else {
                // Không có dữ liệu unified (ngày cũ trước khi có tính năng này)
                pred.resultUnified = null;
            }

            // ========== PHƯƠNG PHÁP 3: ADVANCED ==========
            if (pred.danhAdvanced && pred.danhAdvanced.numbers && pred.danhAdvanced.numbers.length > 0) {
                const calcAdvanced = calculateWinLoss(pred.danhAdvanced.numbers, winningNumber, pred.betAmountAdvanced || 10, totalLossSoFarAdvanced);
                pred.resultAdvanced = {
                    winningNumber,
                    totalBet: calcAdvanced.totalBet,
                    winAmount: calcAdvanced.winAmount,
                    profit: calcAdvanced.profit,
                    totalLossToDate: calcAdvanced.totalLossToDate,
                    isWin: calcAdvanced.isWin
                };
                totalLossSoFarAdvanced = calcAdvanced.totalLossToDate;
            } else {
                // Không có dữ liệu advanced (ngày cũ trước khi có tính năng này)
                pred.resultAdvanced = null;
            }

            updatedCount++;
        } else {
            // Chưa có kết quả (ngày tương lai hoặc hôm nay chưa xổ)
            pred.result = null;
            pred.resultUnified = null;
            pred.resultAdvanced = null;
        }
    }

    await fs.writeFile(PREDICTIONS_PATH, JSON.stringify(predictions, null, 2));
    console.log(`[Daily Analysis] === ĐỒNG BỘ HOÀN TẤT (${updatedCount} ngày đã cập nhật) ===`);
}

module.exports = {
    checkAndUpdateHistory,
    analyzeAndSavePrediction,
    syncPredictionHistory
};