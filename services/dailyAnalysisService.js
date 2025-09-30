// services/dailyAnalysisService.js
const fs = require('fs').promises;
const path = require('path');
const lotteryService = require('./lotteryService');
const { getCombinedSuggestions, calculateOmWinLoss, calculateDanhWinLoss } = require('./simulationService');

const PREDICTIONS_PATH = path.join(__dirname, '..', 'data', 'predictions.json');
const HISTORY_PATH = path.join(__dirname, '..', 'data', 'prediction_history.json');

/**
 * Đọc file JSON một cách an toàn, trả về mảng rỗng nếu file không tồn tại.
 */
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // File không tồn tại, trả về mảng rỗng
        }
        throw error;
    }
}

/**
 * Chạy khi có dữ liệu mới: Đối chiếu dự đoán cũ và tính toán thắng thua.
 */
async function checkAndUpdateHistory() {
    console.log('[Daily Analysis] Bắt đầu kiểm tra và cập nhật lịch sử...');
    const predictions = await readJsonFile(PREDICTIONS_PATH);
    if (predictions.length === 0) {
        console.log('[Daily Analysis] Không có dự đoán cũ để đối chiếu. Bỏ qua.');
        return;
    }

    const rawData = lotteryService.getRawData();
    if (!rawData || rawData.length === 0) {
        console.error('[Daily Analysis] Lỗi: Không có dữ liệu xổ số.');
        return;
    }

    const latestResult = rawData[rawData.length - 1];
    const latestDate = new Date(latestResult.date).toISOString().split('T')[0];

    for (const prediction of predictions) {
        // Chỉ xử lý dự đoán cho ngày hôm qua
        if (prediction.date === latestDate) {
            console.log(`[Daily Analysis] Tìm thấy dự đoán cho ngày ${latestDate}. Đang xử lý...`);
            const winningNumber = latestResult.special.toString().padStart(2, '0');
            
            // Tính toán thắng/thua cho cả 2 chiến lược dựa trên kết quả thực tế
            const omWinLoss = calculateOmWinLoss(prediction.om.numbers, winningNumber, prediction.betAmount);
            const danhWinLoss = calculateDanhWinLoss(prediction.danh.numbers, winningNumber, prediction.betAmount);

            const historyEntry = {
                date: latestDate,
                winningNumber: winningNumber,
                prediction: prediction,
                results: {
                    omWinLoss,
                    danhWinLoss
                }
            };

            const history = await readJsonFile(HISTORY_PATH);
            history.push(historyEntry);
            await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2));
            console.log(`[Daily Analysis] Đã cập nhật và lưu kết quả cho ngày ${latestDate} vào prediction_history.json.`);
        }
    }
    
    // Sau khi xử lý xong, xóa file dự đoán cũ để chuẩn bị cho lần tiếp theo
    await fs.writeFile(PREDICTIONS_PATH, '[]');
}


/**
 * Chạy sau khi đối chiếu: Phân tích dữ liệu mới nhất và lưu dự đoán cho ngày mai.
 */
async function analyzeAndSavePrediction() {
    console.log('[Daily Analysis] Bắt đầu phân tích và lưu dự đoán cho ngày mai...');
    const rawData = lotteryService.getRawData();
     if (!rawData || rawData.length < 4) {
        console.log('[Daily Analysis] Không đủ dữ liệu để tạo dự đoán mới. Cần ít nhất 4 ngày.');
        return;
    }
    
    const historicalSpecials = rawData.map(d => d.special.toString().padStart(2, '0'));
    const recentDays = historicalSpecials.slice(-3); // Lấy 3 ngày gần nhất

    const analysis = getCombinedSuggestions(historicalSpecials, recentDays);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const predictionDate = tomorrow.toISOString().split('T')[0];
    
    // Giả sử mức cược mặc định là 10k/con cho lần chạy tự động
    const defaultBetAmount = 10; 

    const newPrediction = {
        date: predictionDate,
        basedOn: recentDays,
        betAmount: defaultBetAmount,
        om: { numbers: analysis.leastLikely },
        danh: { numbers: analysis.mostLikely }
    };
    
    // Lưu ý: Chúng ta chỉ lưu 1 dự đoán cho ngày tiếp theo
    await fs.writeFile(PREDICTIONS_PATH, JSON.stringify([newPrediction], null, 2));
    console.log(`[Daily Analysis] Đã lưu dự đoán cho ngày ${predictionDate} vào predictions.json.`);
}

module.exports = { checkAndUpdateHistory, analyzeAndSavePrediction };