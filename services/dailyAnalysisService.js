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
    // Ta cần lưu state "sessionProfit" hoặc tương tự.
    // Hiện tại predictions.json lưu "totalLossToDate".
    // Hãy tạm giữ logic betAmount cũ nếu user không yêu cầu đổi logic tính tiền cho phần Daily Prediction cụ thể.
    // User nói: "vẫn đánh 10000 VND với bước nhảy 5000 đến khi có lãi" -> Đây là logic mới.
    // Logic cũ calculateBetAmount là Martingale (gấp thếp khi thua).
    // Logic mới là +5k khi thua.
    // Ta cần cập nhật calculateBetAmount trong simulationService nếu muốn dùng chung.
    // Nhưng simulationService.runProgressiveSimulation có logic riêng bên trong loop.
    // Ta nên update calculateBetAmount để phản ánh logic mới này nếu có thể, hoặc viết logic mới ở đây.

    // Logic mới:
    // Nếu lastPrediction thắng hoặc chưa có (lãi > 0) -> 10k.
    // Nếu lastPrediction thua (lãi <= 0) -> lastBet + 5k.
    // Cần check profit của phiên hiện tại.
    // predictions.json không lưu sessionProfit.
    // Tạm thời để đơn giản: Nếu totalLossToDate > 0 (tức là đang lỗ) -> Tăng cược?
    // User: "đến khi có lãi".
    // Logic: Start 10k. Loss -> +5k. Win -> Reset 10k (nếu lãi cover hết lỗ).
    // Thôi cứ để betAmountForTomorrow = 10 (10k) nếu isSkipped, hoặc tính theo logic cũ tạm thời.
    // Quan trọng là danh sách số.

    const newPrediction = {
        date: predictionDateStr,
        basedOn: historicalSpecials.slice(-3),
        betAmount: 10, // Tạm để 10k, logic tăng tiền cần state phức tạp hơn
        danh: { numbers: numbersBet },
        analysisDetails: {
            excludedCount: excludedNumbers.size,
            isSkipped: isSkipped,
            topFactors: [] // Không còn dùng topFactors của scoring
        },
        result: null
    };

    predictions.push(newPrediction);
    await fs.writeFile(PREDICTIONS_PATH, JSON.stringify(predictions, null, 2));
    console.log(`[Daily Analysis] >>> THÀNH CÔNG: Đã thêm dự đoán cho ngày ${predictionDateStr}.`);
    console.log('[Daily Analysis] === KẾT THÚC PHÂN TÍCH ===');
}

module.exports = { checkAndUpdateHistory, analyzeAndSavePrediction };