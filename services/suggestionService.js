// services/suggestionService.js

/**
 * Định nghĩa "Số con" cho mỗi loại thống kê.
 */
const childCaseCountMap = {
    'consecutivePairs': 1,
    'consecutiveIncreasingNumbers': 1,
    'consecutiveDecreasingNumbers': 1,
    'alternatingNumberPairs': 2,
    'consecutiveDoubleNumbers': 10,
    'consecutiveOffsetDoubleNumbers': 10,
    'consecutiveHeads': 10,
    'consecutiveTails': 10,
    'alternatingHeads': 10,
    'alternatingTails': 10,
    'increasingHeads': 10,
    'decreasingHeads': 10,
    'increasingTails': 10,
    'decreasingTails': 10,
    'oddConsecutiveHeads': 10,
    'oddConsecutiveTails': 10,
    'oddDecreasingHeads': 10,
    'oddDecreasingTails': 10,
    'evenIncreasingHeads': 10,
    'evenIncreasingTails': 10,
    'evenDecreasingHeads': 10,
    'evenDecreasingTails': 10,
    'evenHeadsGreaterThan4': 20,
    'evenHeadsLessThan4': 20,
    'evenTailsGreaterThan4': 20,
    'evenTailsLessThan4': 20,
    'oddHeadsGreaterThan5': 20,
    'oddHeadsLessThan5': 20,
    'oddTailsGreaterThan5': 20,
    'oddTailsLessThan5': 20,
    'headTail_0101': 4, 'headTail_0100': 4, 'headTail_0111': 10, 'headTail_0110': 10,
    'headTail_0001': 4, 'headTail_0000': 4, 'headTail_0011': 10, 'headTail_0010': 10,
    'headTail_1101': 10, 'headTail_1100': 10, 'headTail_1111': 25, 'headTail_1110': 25,
    'headTail_1001': 10, 'headTail_1000': 10, 'headTail_1011': 25, 'headTail_1010': 25,
    'headTail_401': 2, 'headTail_400': 2, 'headTail_411': 5, 'headTail_410': 5,
    'headTail_501': 2, 'headTail_500': 2, 'headTail_511': 5, 'headTail_510': 5,
    'headTail_014': 2, 'headTail_004': 2, 'headTail_114': 5, 'headTail_104': 5,
    'headTail_015': 2, 'headTail_005': 2, 'headTail_115': 5, 'headTail_105': 5,
    'sum_inc_trad': 1, 'sum_dec_trad': 1, 'sum_inc_new': 1, 'sum_dec_new': 1,
    'sum_seq_asc_trad': 10, 'sum_seq_desc_trad': 10, 'sum_seq_asc_new': 10, 'sum_seq_desc_new': 10,
    'sum_consecutive_trad': 10, 'sum_consecutive_new': 10,
    'sum_range_trad_1-2': 20, 'sum_range_trad_3-4': 20, 'sum_range_trad_5-6': 20, 'sum_range_trad_7-8': 20, 'sum_range_trad_9-10': 19,
    'sum_range_new_0-3': 10, 'sum_range_new_4-6': 18, 'sum_range_new_7-9': 27, 'sum_range_new_10-12': 27, 'sum_range_new_13-15': 18, 'sum_range_new_16-18': 10,
    'sum_even_odd_trad_even_asc': 10, 'sum_even_odd_trad_even_desc': 10, 'sum_even_odd_trad_odd_asc': 10, 'sum_even_odd_trad_odd_desc': 10,
    'sum_even_odd_new_even_asc': 10, 'sum_even_odd_new_even_desc': 10, 'sum_even_odd_new_odd_asc': 10, 'sum_even_odd_new_odd_desc': 10,
    'sum_sole_trad': 10, 'sum_sole_new': 10,
    'sum_sole_pairs_new': 1,
    'parity_even-odd_asc': 25, 'parity_even-odd_desc': 25,
    'parity_odd-even_asc': 25, 'parity_odd-even_desc': 25,
    'parity_even-even_asc': 25, 'parity_even-even_desc': 25,
    'parity_odd-odd_asc': 25, 'parity_odd-odd_desc': 25,
};

const sumLists = {
    traditional: { 1: [1, 10, 29, 38, 47, 56, 65, 74, 83, 92], 2: [2, 11, 20, 39, 48, 57, 66, 75, 84, 93], 3: [3, 12, 21, 30, 49, 58, 67, 76, 85, 94], 4: [4, 13, 22, 31, 40, 59, 68, 77, 86, 95], 5: [5, 14, 23, 32, 41, 50, 69, 78, 87, 96], 6: [6, 15, 24, 33, 42, 51, 60, 79, 88, 97], 7: [7, 16, 25, 34, 43, 52, 61, 70, 89, 98], 8: [8, 17, 26, 35, 44, 53, 62, 71, 80, 99], 9: [9, 18, 27, 36, 45, 54, 63, 72, 81, 90], 10: [19, 28, 37, 46, 55, 64, 73, 82, 91] },
    new: { 0: [0], 1: [1, 10], 2: [2, 11, 20], 3: [3, 12, 21, 30], 4: [4, 13, 22, 31, 40], 5: [5, 14, 23, 32, 41, 50], 6: [6, 15, 24, 33, 42, 51, 60], 7: [7, 16, 25, 34, 43, 52, 61, 70], 8: [8, 17, 26, 35, 44, 53, 62, 71, 80], 9: [9, 18, 27, 36, 45, 54, 63, 72, 81, 90], 10: [19, 28, 37, 46, 55, 64, 73, 82, 91], 11: [29, 38, 47, 56, 65, 74, 83, 92], 12: [39, 48, 57, 66, 75, 84, 93], 13: [49, 58, 67, 76, 85, 94], 14: [59, 68, 77, 86, 95], 15: [69, 78, 87, 96], 16: [79, 88, 97], 17: [89, 98], 18: [99] }
};

const calculateSum = (number, sumType = 'traditional') => {
    const digits = String(number).padStart(2, '0').split('').map(Number);
    const rawSum = digits[0] + digits[1];
    if (sumType === 'new') return rawSum;
    if (number === 0) return 10;
    return rawSum % 10 === 0 ? 10 : rawSum % 10;
};

/**
 * Hàm sinh ra danh sách các số cần "ôm" dựa trên loại thống kê và chuỗi hiện tại.
 */
function getBettingNumbers(statName, streakDetail) {
    const ruleNumbers = streakDetail.numbers;
    
    // SỬA LỖI: Kiểm tra cả 'extracted' và 'matched'
    const sequence = streakDetail.results.map(day => {
        const matchedNums = (day.extracted && day.extracted.length > 0) 
                            ? day.extracted 
                            : (day.matched && day.matched.length > 0) 
                            ? day.matched 
                            : day.numbers; // Fallback
        return matchedNums[0];
    });

    if (!ruleNumbers || ruleNumbers.length === 0) return [];
    
    if (statName.includes('Heads') || statName.includes('head')) {
        return Array.from({ length: 10 }, (_, i) => ruleNumbers[0] * 10 + i);
    }
    if (statName.includes('Tails') || statName.includes('tail')) {
        return Array.from({ length: 10 }, (_, i) => i * 10 + ruleNumbers[0]);
    }
    if (statName === 'consecutiveDoubleNumbers') return [0, 11, 22, 33, 44, 55, 66, 77, 88, 99];
    if (statName === 'consecutiveOffsetDoubleNumbers') return [5, 16, 27, 38, 49, 50, 61, 72, 83, 94];
    if (statName === 'consecutivePairs') return [ruleNumbers[0]];
    if (statName.includes('alternatingNumberPairs')) {
        return [ruleNumbers[sequence.length % 2]];
    }
    if (statName.includes('increasing-numbers')) {
        const lastNum = sequence[sequence.length - 1];
        return [lastNum + 1];
    }
    if (statName.includes('decreasing-numbers')) {
        const lastNum = sequence[sequence.length - 1];
        return [lastNum - 1];
    }
    
    if (statName.includes('sum_')) {
        const sumType = statName.includes('_trad') ? 'traditional' : 'new';
        if (statName.includes('sum_seq_asc')) {
            const lastSum = calculateSum(sequence[sequence.length - 1], sumType);
            const nextSum = lastSum + 1;
            return sumLists[sumType][nextSum] || [];
        }
        if (statName.includes('sum_seq_desc')) {
            const lastSum = calculateSum(sequence[sequence.length - 1], sumType);
            const nextSum = lastSum - 1;
            return sumLists[sumType][nextSum] || [];
        }
        if (statName.includes('sum_consecutive')) {
            const sum = calculateSum(sequence[0], sumType);
            return sumLists[sumType][sum] || [];
        }
    }
    
    return ruleNumbers;
}


function generateSuggestions(recentStreaks, overallStats) {
    if (!recentStreaks || !overallStats) return recentStreaks;

    const suggestedStreaks = { ...recentStreaks };

    for (const length in suggestedStreaks.streaks) {
        const currentStreakLength = parseInt(length, 10);

        suggestedStreaks.streaks[length].forEach(streak => {
            streak.details.forEach(detail => {
                const statName = streak.statName;
                const historicalData = overallStats[statName];

                if (!historicalData || historicalData.recordLength === 0 || historicalData.secondPlaceLength === 0) {
                    return;
                }

                if (currentStreakLength < historicalData.secondPlaceLength - 1) {
                    return;
                }

                const recordRunsCount = historicalData.recordRuns.length;
                const secondPlaceRunsCount = historicalData.secondPlaceRuns.length;
                const childCases = childCaseCountMap[statName] || 10;
                
                const scoreLongest = (recordRunsCount * (-70)) + (recordRunsCount * childCases * 0.705);
                const scoreSecondLongest = secondPlaceRunsCount * childCases * 0.705;

                let shouldSuggest = false;
                
                if (currentStreakLength === historicalData.recordLength) {
                    shouldSuggest = true;
                } else if (currentStreakLength === historicalData.secondPlaceLength) {
                    if (scoreLongest > scoreSecondLongest) {
                        shouldSuggest = true;
                    }
                } else if (currentStreakLength === historicalData.secondPlaceLength - 1) {
                    if (scoreSecondLongest > scoreLongest) {
                        shouldSuggest = true;
                    }
                }

                if (shouldSuggest) {
                    const profit = scoreSecondLongest - scoreLongest;
                    const text = `Nên Ôm (Điểm Lãi: ${profit.toFixed(1)})`;
                    const suggestionClass = "text-success fw-bold";
                    const numbersToBet = getBettingNumbers(statName, detail);

                    detail.suggestion = { 
                        text, 
                        class: suggestionClass,
                        numbersToBet: numbersToBet.sort((a,b)=>a-b)
                    };
                }
            });
        });
    }

    return suggestedStreaks;
}


module.exports = { generateSuggestions };