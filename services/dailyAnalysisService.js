// services/dailyAnalysisService.js
const fs = require('fs').promises;
const path = require('path');
const lotteryService = require('./lotteryService');
const statisticsService = require('./statisticsService');
const { calculateBetAmount, calculateWinLoss } = require('./simulationService');
const exclusionService = require('./exclusionService');

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

        const betAmount = predictionToUpdate.betAmount;
        const calculation = calculateWinLoss(predictionToUpdate.danh.numbers, winningNumber, betAmount, totalLossSoFar);

        predictionToUpdate.result = {
            winningNumber,
            totalBet: calculation.totalBet,
            winAmount: calculation.winAmount,
            profit: calculation.profit,
            totalLossToDate: calculation.totalLossToDate
        };

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
    if (predictions.some(p => p.date === predictionDateStr)) {
        console.log(`[Daily Analysis] Dự đoán cho ngày ${predictionDateStr} đã tồn tại. Bỏ qua.`);
        return;
    }

    // [MỚI] Logic phân tích dựa trên loại trừ
    const globalStats = await statisticsService.getStatsData();
    console.log(`[Daily Analysis] Global Stats Keys: ${Object.keys(globalStats).length}`);

    // currentIndex là index của ngày cuối cùng có kết quả (để dự đoán cho ngày mai)
    const currentIndex = rawData.length - 1;
    console.log(`[Daily Analysis] Current Index: ${currentIndex}, Raw Data Length: ${rawData.length}`);

    const excludedNumbers = await exclusionService.getExclusions(rawData, currentIndex, globalStats);
    console.log(`[Daily Analysis] Excluded Numbers Count: ${excludedNumbers.size}`);

    // Tạo dàn số đánh (Tất cả - Loại trừ)
    const allNumbers = Array.from({ length: 100 }, (_, k) => k.toString().padStart(2, '0'));
    let numbersBet = allNumbers.filter(n => !excludedNumbers.has(parseInt(n, 10)));

    // Kiểm tra điều kiện chơi
    let isSkipped = false;
    if (excludedNumbers.size <= 30) {
        isSkipped = true;
        numbersBet = [];
        console.log(`[Daily Analysis] Số lượng loại trừ (${excludedNumbers.size}) <= 30. BỎ QUA ngày mai.`);
    }

    const lastPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;
    const lastTotalLoss = lastPrediction?.result?.totalLossToDate || 0;
    // User yêu cầu "vẫn đánh 10000 VND với bước nhảy 5000". Logic calculateBetAmount hiện tại có thể khác.
    // Tuy nhiên, để nhất quán với simulation, ta nên dùng logic progressive của simulationService.
    // Nhưng dailyAnalysisService chạy độc lập mỗi ngày, state được lưu trong predictions.json.
    const numbersToBet = allNumbers.filter(n => !excludedNumbers.has(parseInt(n)));

    // 3. Tính tiền cược (Gấp thếp)
    // Cần lấy totalLossToDate từ ngày gần nhất CÓ KẾT QUẢ
    // Tìm ngày gần nhất có result
    let lastLoss = 0;
    for (let i = predictions.length - 1; i >= 0; i--) {
        if (predictions[i].result) {
            lastLoss = predictions[i].result.totalLossToDate;
            break;
        }
    }

    const betAmount = calculateBetAmount(lastLoss);

    const newPrediction = {
        date: predictionDateStr,
        danh: {
            numbers: numbersToBet,
            count: numbersToBet.length
        },
        betAmount: betAmount,
        analysisDetails: {
            excludedCount: excludedNumbers.size,
            // Có thể thêm chi tiết loại trừ vào đây nếu cần
        },
        result: null // Chưa có kết quả
    };

    // [MỚI] Ghi đè nếu đã tồn tại, thay vì bỏ qua
    const existingIndex = predictions.findIndex(p => p.date === predictionDateStr);
    if (existingIndex !== -1) {
        console.log(`[Daily Analysis] Cập nhật dự đoán cho ngày ${predictionDateStr}.`);
        predictions[existingIndex] = newPrediction;
    } else {
        predictions.push(newPrediction);
    }

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
    let updatedCount = 0;

    // Sắp xếp predictions theo ngày tăng dần để tính lũy kế đúng
    predictions.sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i];
        const actualSpecial = dateToResultMap.get(pred.date);

        if (actualSpecial !== undefined) {
            // Có kết quả -> Tính toán lại
            const winningNumber = actualSpecial.toString().padStart(2, '0');

            // Tính toán lại win/loss dựa trên totalLossSoFar tích lũy
            const calculation = calculateWinLoss(pred.danh.numbers, winningNumber, pred.betAmount, totalLossSoFar);

            // Cập nhật result
            pred.result = {
                winningNumber,
                totalBet: calculation.totalBet,
                winAmount: calculation.winAmount,
                profit: calculation.profit,
                totalLossToDate: calculation.totalLossToDate
            };

            // Cập nhật totalLossSoFar cho vòng lặp sau
            totalLossSoFar = calculation.totalLossToDate;
            updatedCount++;
        } else {
            // Chưa có kết quả (ngày tương lai hoặc hôm nay chưa xổ)
            // Giữ nguyên dự đoán, nhưng đảm bảo result là null
            pred.result = null;
            // totalLossSoFar không đổi (vì chưa biết thắng thua)
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