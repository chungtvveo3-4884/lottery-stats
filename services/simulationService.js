// services/simulationService.js
const { SETS } = require('../utils/numberAnalysis');

// Tự động lấy tất cả các khóa (bộ số) từ numberAnalysis để phân tích
const allSetKeys = Object.keys(SETS).filter(key => 
    !key.endsWith('_SEQUENCE') && 
    !key.endsWith('_DIGITS') && 
    key !== 'ALL' && 
    key !== 'DIGITS'
);

// Cache lại các thuộc tính của mỗi số để tăng tốc độ
const numberPropertiesCache = new Map();
for (let i = 0; i < 100; i++) {
    const numStr = i.toString().padStart(2, '0');
    const properties = [];
    for (const key of allSetKeys) {
        if (SETS[key].includes(numStr)) {
            properties.push(key);
        }
    }
    numberPropertiesCache.set(numStr, properties);
}

function getSingleScoredSuggestions(history, previousDays, trendingFactors) {
    const sourceProperties = new Set();
    previousDays.forEach(day => {
        (numberPropertiesCache.get(day) || []).forEach(prop => sourceProperties.add(prop));
    });

    if (sourceProperties.size === 0) return new Map();
    
    const targetSetScores = new Map();
    for (let i = 0; i < history.length - 1; i++) {
        const currentDayProps = numberPropertiesCache.get(history[i]) || [];
        let isSource = false;
        for(const prop of currentDayProps){
            if(sourceProperties.has(prop)){
                isSource = true;
                break;
            }
        }
        if (isSource) {
            (numberPropertiesCache.get(history[i + 1]) || []).forEach(prop => {
                targetSetScores.set(prop, (targetSetScores.get(prop) || 0) + 1);
            });
        }
    }
    
    if(targetSetScores.size > 0) {
        const maxScore = Math.max(...targetSetScores.values());
        [...targetSetScores.entries()].forEach(([factor, score]) => {
            if (score === maxScore) {
                trendingFactors.set(factor, (trendingFactors.get(factor) || 0) + score);
            }
        });
    }

    const numberScores = new Map();
    for (let i = 0; i < 100; i++) {
        const numStr = i.toString().padStart(2, '0');
        const props = numberPropertiesCache.get(numStr) || [];
        let finalScore = 0;
        props.forEach(prop => {
            finalScore += (targetSetScores.get(prop) || 0);
        });
        numberScores.set(numStr, finalScore);
    }
    return numberScores;
}

function getCombinedSuggestions(history, recentDays) {
    const combinedScores = new Map();
    const trendingFactors = new Map();

    for (let i = 0; i < 100; i++) {
        combinedScores.set(i.toString().padStart(2, '0'), { score: 0, reasons: [] });
    }

    for (let j = 1; j <= 3; j++) {
        const previousDays = recentDays.slice(recentDays.length - j);
        const scores = getSingleScoredSuggestions(history, previousDays, trendingFactors);
        scores.forEach((score, num) => {
            const current = combinedScores.get(num);
            current.score += score;
        });
    }

    trendingFactors.forEach((_, factor) => {
        if(SETS[factor]){
            for(const num of SETS[factor]){
                if(combinedScores.has(num)){
                    combinedScores.get(num).reasons.push(factor);
                }
            }
        }
    });

    const sortedNumbers = [...combinedScores.entries()].sort((a, b) => {
        const scoreDiff = b[1].score - a[1].score;
        if (scoreDiff !== 0) return scoreDiff;
        return Math.random() - 0.5;
    }).map(entry => entry[0]);

    const analysisDetails = {
        topFactors: [...trendingFactors.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10),
        numberScores: [...combinedScores.entries()].sort((a,b) => b[1].score - a[1].score)
    };

    return {
        mostLikely: sortedNumbers.slice(0, 70),
        leastLikely: sortedNumbers.slice(70),
        analysisDetails
    };
}

function calculateOmWinLoss(numbersToBet, winningNumber, betAmountPerNumber) {
    const he_so_thang = 0.705;
    const he_so_thua = 70;
    const initialWin = numbersToBet.length * betAmountPerNumber * he_so_thang;
    if (numbersToBet.includes(winningNumber)) {
        return initialWin - (betAmountPerNumber * he_so_thua);
    }
    return initialWin;
}

function calculateDanhWinLoss(numbersToBet, winningNumber, betAmountPerNumber) {
    const he_so = 0.8;
    const totalBet = numbersToBet.length * betAmountPerNumber * he_so;
    if (numbersToBet.includes(winningNumber)) {
        return (betAmountPerNumber * 70) - totalBet;
    }
    return -totalBet;
}

function runSimulation(options, lotteryData) {
    const { simulationDays, initialCapital, betAmount } = options;
    if (!simulationDays || !initialCapital || !betAmount) throw new Error('Thiếu thông số.');
    if (!lotteryData || lotteryData.length === 0) throw new Error('Không có dữ liệu.');

    const formattedData = lotteryData.map(item => ({ date: new Date(item.date), special: item.special.toString().padStart(2, '0')})).sort((a, b) => a.date - b.date);
    const daysToSimulate = parseInt(simulationDays, 10);
    const capital = parseInt(initialCapital, 10);
    const betAmountPerNumber = parseInt(betAmount, 10);
    const historicalSpecials = formattedData.map(d => d.special);
    const dailyResults = [];
    let currentCapital = capital;
    
    const startIndex = 3;
    if (historicalSpecials.length < startIndex + 1) return { dailyResults: [], initialCapital: capital };
    const endIndex = Math.min(startIndex + daysToSimulate, historicalSpecials.length - 1);

    for (let i = startIndex; i < endIndex; i++) {
        const historyUpToCurrentDay = historicalSpecials.slice(0, i + 1);
        const winningNumber = String(Math.floor(Math.random() * 100)).padStart(2, '0');
        const currentDate = formattedData[i + 1].date.toISOString().split('T')[0];
        
        const recentDays = historicalSpecials.slice(i - 2, i + 1);
        const analysis = getCombinedSuggestions(historyUpToCurrentDay, recentDays);
        
        const omWinLoss = calculateOmWinLoss(analysis.leastLikely, winningNumber, betAmountPerNumber);
        const danhWinLoss = calculateDanhWinLoss(analysis.mostLikely, winningNumber, betAmountPerNumber);

        const dayResult = {
            day: dailyResults.length + 1,
            date: currentDate,
            winningNumber: winningNumber,
            om: { numbers: analysis.leastLikely, winLoss: omWinLoss },
            danh: { numbers: analysis.mostLikely, winLoss: danhWinLoss }
        };

        const bestWinLoss = Math.max(omWinLoss, danhWinLoss);
        currentCapital += bestWinLoss;
        dayResult.endCapital = currentCapital;
        dailyResults.push(dayResult);
    }

    return { dailyResults, initialCapital: capital };
}

module.exports = { 
    runSimulation, 
    getCombinedSuggestions, 
    calculateOmWinLoss, 
    calculateDanhWinLoss
};