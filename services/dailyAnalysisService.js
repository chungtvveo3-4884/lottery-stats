// services/dailyAnalysisService.js
const fs = require('fs').promises;
const path = require('path');
const lotteryService = require('./lotteryService');
const { getCombinedSuggestions, calculateBetAmount, calculateWinLoss } = require('./simulationService');

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

    const { mostLikely, analysisDetails } = getCombinedSuggestions(historicalSpecials);
    
    const lastPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;
    const lastTotalLoss = lastPrediction?.result?.totalLossToDate || 0;
    const betAmountForTomorrow = calculateBetAmount(lastTotalLoss);

    const newPrediction = {
        date: predictionDateStr,
        basedOn: historicalSpecials.slice(-3),
        betAmount: betAmountForTomorrow,
        danh: { numbers: mostLikely },
        analysisDetails: { topFactors: analysisDetails.topFactors },
        result: null
    };
    
    predictions.push(newPrediction);
    await fs.writeFile(PREDICTIONS_PATH, JSON.stringify(predictions, null, 2));
    console.log(`[Daily Analysis] >>> THÀNH CÔNG: Đã thêm dự đoán cho ngày ${predictionDateStr} (Cược ${betAmountForTomorrow}k).`);
    console.log('[Daily Analysis] === KẾT THÚC PHÂN TÍCH ===');
}

module.exports = { checkAndUpdateHistory, analyzeAndSavePrediction };