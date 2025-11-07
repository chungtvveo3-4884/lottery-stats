// services/simulationService.js
const { SETS, getTongTT, getHieu } = require('../utils/numberAnalysis');
const lotteryService = require('./lotteryService');

// --- CÀI ĐẶT CHIẾN LƯỢC ---
const BASE_BET = 10;    // 10.000 VND
const BET_STEP = 5;     // 5.000 VND
const NUM_COUNT = 25;   // Đánh 25 số
const WIN_RATE = 70;    // Tỷ lệ thắng

// --- HÀM TÍNH TOÁN (GẤP THẾP & LÃI LỖ) ---
function calculateBetAmount(totalLossSoFar) {
    let betAmount = BASE_BET;
    while (true) {
        const totalBetToday = NUM_COUNT * betAmount;
        const totalCostIfWin = totalLossSoFar + totalBetToday;
        const potentialWin = betAmount * WIN_RATE;
        if (potentialWin > totalCostIfWin) {
            return betAmount;
        }
        betAmount += BET_STEP;
    }
}

function calculateWinLoss(numbersToBet, winningNumber, betAmount, totalLossSoFar) {
    const totalBetToday = numbersToBet.length * betAmount;
    if (numbersToBet.includes(winningNumber)) {
        const winAmount = betAmount * WIN_RATE;
        const profit = winAmount - (totalBetToday + totalLossSoFar); 
        return {
            isWin: true, profit: profit, winAmount: winAmount,
            totalBet: totalBetToday, totalLossToDate: 0 
        };
    } else {
        const profit = -totalBetToday;
        return {
            isWin: false, profit: profit, winAmount: 0,
            totalBet: totalBetToday, totalLossToDate: totalLossSoFar + totalBetToday
        };
    }
}

// --- THUẬT TOÁN PHÂN TÍCH MỚI ---

// Xây dựng cache cho các thuộc tính số khi khởi động
const numberPropertiesCache = new Map();
function buildNumberPropertiesCache() {
    if (numberPropertiesCache.size > 0) return;
    const allSetKeys = Object.keys(SETS).filter(key => 
        !key.endsWith('_SEQUENCE') && !key.endsWith('_DIGITS') && key !== 'ALL' && key !== 'DIGITS'
    );
    for (let i = 0; i < 100; i++) {
        const numStr = i.toString().padStart(2, '0');
        const properties = [];
        for (const key of allSetKeys) {
            // Tối ưu: Chỉ cần kiểm tra xem key có trong SETS và SETS[key] có chứa numStr không
            if (SETS[key] && SETS[key].includes(numStr)) {
                properties.push(key);
            }
        }
        numberPropertiesCache.set(numStr, properties);
    }
    console.log('[SimulationService] Cache thuộc tính số đã được xây dựng.');
}

function getNumberProperties(numberString) {
    if (numberPropertiesCache.size === 0) {
        buildNumberPropertiesCache();
    }
    return numberPropertiesCache.get(numberString) || [];
}

/**
 * [MỚI] Thuật toán phân tích chuyên sâu
 */
function getCombinedSuggestions(historicalSpecials) {
    const numberStats = lotteryService.getNumberStats();
    const htStats = lotteryService.getHeadTailStats();
    const sdStats = lotteryService.getSumDiffStats();

    if (!numberStats || !htStats || !sdStats) {
        throw new Error('Một hoặc nhiều file thống kê chưa được tải (number_stats, head_tail_stats, sum_difference_stats).');
    }

    const numberScores = new Map();

    // 1. Lấy thuộc tính của ngày gần nhất làm "Tác nhân"
    const lastDayNumber = historicalSpecials[historicalSpecials.length - 1];
    const triggerProps = getNumberProperties(lastDayNumber);
    
    // 2. Chấm điểm cho từng số 00-99
    for (let i = 0; i < 100; i++) {
        const numStr = i.toString().padStart(2, '0');
        let finalScore = 0;
        let reasons = []; // Lưu lý do được cộng điểm

        // 2a. Lấy điểm cơ bản từ number_stats.json (tần suất)
        const baseStats = numberStats[numStr];
        if (baseStats) {
            finalScore += (baseStats.frequency || 0) * 10; // Tăng trọng số cho tần suất
            finalScore += (baseStats.daysSinceLast || 0); // Thưởng cho các số "gan"
        }
        
        // 2b. Lấy các thuộc tính của số đang xét
        const targetProps = getNumberProperties(numStr);

        // 2c. Tính điểm xu hướng (dựa trên tác nhân)
        for (const trigger of triggerProps) {
            // Tìm nguồn thống kê (head_tail_stats hoặc sum_difference_stats)
            const statSource = htStats[trigger.toLowerCase()] || sdStats[trigger.toLowerCase()];
            if (statSource && statSource.nextDayStats) {
                // Duyệt qua các thuộc tính của số đang xét (target)
                for (const target of targetProps) {
                    let weight = 0;
                    const targetKey = target.toLowerCase();
                    
                    // Tìm trọng số tương ứng
                    if (statSource.nextDayStats.head && statSource.nextDayStats.head[targetKey]) {
                        weight = statSource.nextDayStats.head[targetKey];
                    } else if (statSource.nextDayStats.tail && statSource.nextDayStats.tail[targetKey]) {
                        weight = statSource.nextDayStats.tail[targetKey];
                    } else if (statSource.nextDayStats.sum && statSource.nextDayStats.sum[targetKey]) {
                        weight = statSource.nextDayStats.sum[targetKey];
                    } else if (statSource.nextDayStats.diff && statSource.nextDayStats.diff[targetKey]) {
                        weight = statSource.nextDayStats.diff[targetKey];
                    }
                    
                    if (weight > 0) {
                        finalScore += weight; // Cộng điểm xu hướng
                        reasons.push(`${trigger} -> ${target} (${weight})`);
                    }
                }
            }
        }
        numberScores.set(numStr, { score: finalScore, reasons });
    }

    // 3. Sắp xếp và chọn 25 số
    const sortedNumbers = [...numberScores.entries()]
        .sort((a, b) => b[1].score - a[1].score) // Sắp xếp theo điểm từ cao đến thấp
        .map(entry => entry[0]);
        
    const topFactors = triggerProps.map(prop => [prop, 1]); // Hiển thị các tác nhân

    return {
        mostLikely: sortedNumbers.slice(0, NUM_COUNT), // Lấy 25 số
        analysisDetails: {
            topFactors: topFactors
        }
    };
}


// === LOGIC MÔ PHỎNG GIẢ LẬP (GẤP THẾP) ===
function runProgressiveSimulation(options, lotteryData) {
    const { simulationDays, initialCapital } = options;
    if (!simulationDays || !initialCapital) throw new Error('Thiếu Vốn hoặc Số ngày.');
    if (!lotteryData || lotteryData.length === 0) throw new Error('Không có dữ liệu.');

    const days = parseInt(simulationDays, 10);
    const capital = parseInt(initialCapital, 10);
    const historicalSpecials = lotteryData.map(d => d.special.toString().padStart(2, '0'));
    
    const dailyResults = [];
    let currentCapital = capital;
    let totalLossSoFar = 0;

    const startIndex = 3;
    if (historicalSpecials.length < startIndex + 1) {
        throw new Error('Không đủ dữ liệu lịch sử (cần ít nhất 4 ngày).');
    }
    const endIndex = Math.min(startIndex + days, historicalSpecials.length - 1);

    for (let i = startIndex; i < endIndex; i++) {
        const historyUpToCurrentDay = historicalSpecials.slice(0, i + 1);
        const winningNumber = String(Math.floor(Math.random() * 100)).padStart(2, '0');
        
        // Phân tích bằng logic mới
        const { mostLikely } = getCombinedSuggestions(historyUpToCurrentDay);
        
        const betAmount = calculateBetAmount(totalLossSoFar);
        
        if (currentCapital < (betAmount * NUM_COUNT)) {
            dailyResults.push({ 
                day: dailyResults.length + 1,
                date: "N/A",
                error: 'Vỡ nợ - Không đủ vốn cược', 
                betAmount: betAmount,
                totalBet: (betAmount * NUM_COUNT),
                profit: 0,
                endCapital: currentCapital
            });
            break;
        }

        const calculation = calculateWinLoss(mostLikely, winningNumber, betAmount, totalLossSoFar);
        
        const profitToday = calculation.isWin ? (calculation.winAmount - calculation.totalBet) : calculation.profit;
        currentCapital += profitToday;
        totalLossSoFar = calculation.totalLossToDate;

        dailyResults.push({
            day: dailyResults.length + 1,
            date: lotteryData[i + 1].date.substring(0, 10),
            winningNumber,
            numbersBet: mostLikely,
            betAmount,
            totalBet: calculation.totalBet,
            winAmount: calculation.winAmount,
            profit: profitToday, // Lãi/lỗ ròng của ngày
            totalLossSoFar: totalLossSoFar,
            endCapital: currentCapital
        });
    }

    return { dailyResults, initialCapital: capital };
}

module.exports = { 
    getCombinedSuggestions,
    calculateBetAmount,
    calculateWinLoss,
    runProgressiveSimulation
};