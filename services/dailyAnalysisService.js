// services/dailyAnalysisService.js
const fs = require('fs').promises;
const path = require('path');
const lotteryService = require('./lotteryService');
const { getCombinedSuggestions, calculateOmWinLoss, calculateDanhWinLoss } = require('./simulationService');

// SỬ DỤNG MỘT FILE DUY NHẤT
const PREDICTIONS_PATH = path.join(__dirname, '..', 'data', 'predictions.json');

async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { return []; } // Nếu file không tồn tại, trả về mảng rỗng
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
    // SỬA LỖI: Luôn lấy 10 ký tự đầu để có định dạng YYYY-MM-DD
    const latestDateStr = latestResult.date.substring(0, 10); 
    console.log(`[Daily Analysis] Kết quả mới nhất trong CSDL là của ngày: ${latestDateStr}, số về: ${latestResult.special}`);

    // Tìm dự đoán trong file có cùng ngày và chưa có kết quả
    const predictionToUpdate = predictions.find(p => p.date === latestDateStr && !p.result);

    if (predictionToUpdate) {
        console.log(`[Daily Analysis] >>> TÌM THẤY dự đoán cần cập nhật cho ngày ${latestDateStr}.`);
        const winningNumber = latestResult.special.toString().padStart(2, '0');
        
        const omWinLoss = calculateOmWinLoss(predictionToUpdate.om.numbers, winningNumber, predictionToUpdate.betAmount);
        const danhWinLoss = calculateDanhWinLoss(predictionToUpdate.danh.numbers, winningNumber, predictionToUpdate.betAmount);

        // Cập nhật kết quả vào chính đối tượng dự đoán đó
        predictionToUpdate.result = { winningNumber, omWinLoss, danhWinLoss };
        
        await fs.writeFile(PREDICTIONS_PATH, JSON.stringify(predictions, null, 2));
        console.log(`[Daily Analysis] >>> THÀNH CÔNG: Đã cập nhật kết quả cho ngày ${latestDateStr} vào predictions.json.`);
    } else {
        console.log(`[Daily Analysis] Không tìm thấy dự đoán nào cần cập nhật cho ngày ${latestDateStr}.`);
    }
    console.log('[Daily Analysis] === KẾT THÚC ĐỐI CHIẾU ===');
}

async function analyzeAndSavePrediction() {
    console.log('[Daily Analysis] === BẮT ĐẦU PHÂN TÍCH CHO NGÀY TIẾP THEO ===');
    const rawData = lotteryService.getRawData();
    if (!rawData || rawData.length < 4) {
        console.log('[Daily Analysis] Không đủ dữ liệu để tạo dự đoán.');
        return;
    }
    
    const latestResult = rawData[rawData.length - 1];
    const latestDateStr = latestResult.date.substring(0, 10);
    
    // SỬA LỖI NGÀY THÁNG: Tính toán ngày tiếp theo một cách an toàn
    const [year, month, day] = latestDateStr.split('-').map(Number);
    const latestDate = new Date(Date.UTC(year, month - 1, day));
    latestDate.setUTCDate(latestDate.getUTCDate() + 1);
    const predictionDateStr = latestDate.toISOString().substring(0, 10);
    
    let predictions = await readJsonFile(PREDICTIONS_PATH);
    if (predictions.some(p => p.date === predictionDateStr)) {
        console.log(`[Daily Analysis] Dự đoán cho ngày ${predictionDateStr} đã tồn tại. Bỏ qua.`);
        return;
    }

    const historicalSpecials = rawData.map(d => d.special.toString().padStart(2, '0'));
    const recentDays = historicalSpecials.slice(-3);
    console.log(`[Daily Analysis] Phân tích dựa trên 3 số cuối: ${recentDays.join(', ')}`);

    const { mostLikely, leastLikely, analysisDetails } = getCombinedSuggestions(historicalSpecials, recentDays);
    
    const newPrediction = {
        date: predictionDateStr,
        basedOn: recentDays,
        betAmount: 10,
        om: { numbers: leastLikely },
        danh: { numbers: mostLikely },
        analysisDetails: { topFactors: analysisDetails.topFactors },
        result: null
    };
    
    predictions.push(newPrediction);
    await fs.writeFile(PREDICTIONS_PATH, JSON.stringify(predictions, null, 2));
    console.log(`[Daily Analysis] >>> THÀNH CÔNG: Đã thêm dự đoán cho ngày ${predictionDateStr} vào predictions.json.`);
    console.log('[Daily Analysis] === KẾT THÚC PHÂN TÍCH ===');
}

module.exports = { checkAndUpdateHistory, analyzeAndSavePrediction };