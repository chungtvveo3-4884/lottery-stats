const fs = require('fs');
const file = './services/statisticsGenerator.js';
let code = fs.readFileSync(file, 'utf8');

// The functions were literally identically named but with the logic swapped compared to headTailStatsGenerator
const strictFunc = `function findAlternatingTypeStreaksNew(data, dateMap, numberMap) {
    const allStreaks = [];

    // Helper to calculate day span
    const getDaySpan = (startDate, endDate) => {
        const [d1, m1, y1] = startDate.split('/').map(Number);
        const [d2, m2, y2] = endDate.split('/').map(Number);
        const date1 = new Date(y1, m1 - 1, d1);
        const date2 = new Date(y2, m2 - 1, d2);
        return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24)) + 1;
    };

    for (let i = 0; i < data.length - 2; i++) {
        // Strict: Day A matches, Day B does NOT match
        if (!numberMap.has(data[i].value) || numberMap.has(data[i + 1].value)) continue;

        let streak = [data[i]];
        let currentIndex = i;
        while (currentIndex < data.length - 2) {
            const nextIndex = currentIndex + 2;
            const dayB = data[currentIndex + 1];
            const dayC = data[nextIndex];
            // Strict: Day B does NOT match, Day C matches
            if (dayB && dayC &&
                isConsecutive(data[currentIndex].date, dayB.date) &&
                isConsecutive(dayB.date, dayC.date) &&
                !numberMap.has(dayB.value) &&
                numberMap.has(dayC.value)) {
                streak.push(dayC);
                currentIndex = nextIndex;
            } else {
                break;
            }
        }

        if (streak.length >= 2) {
            const span = getDaySpan(streak[0].date, streak[streak.length - 1].date);
            if (span % 2 === 1) { // Số lẻ
                allStreaks.push(createStreakObject(data, dateMap, streak, { value: "Theo dạng" }));
            }
        }
    }
    return { streaks: allStreaks.filter(Boolean) };
}`;

const looseFunc = `function findAlternatingTypeStreaks(data, dateMap, { condition, description }) {
    const allStreaks = [];

    // Helper to calculate day span
    const getDaySpan = (startDate, endDate) => {
        const [d1, m1, y1] = startDate.split('/').map(Number);
        const [d2, m2, y2] = endDate.split('/').map(Number);
        const date1 = new Date(y1, m1 - 1, d1);
        const date2 = new Date(y2, m2 - 1, d2);
        return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24)) + 1;
    };

    for (let i = 0; i < data.length - 2; i++) {
        if (!condition(data[i])) continue;

        let streak = [data[i]];
        let currentIndex = i;
        while (currentIndex < data.length - 2) {
            const nextIndex = currentIndex + 2;
            const dayB = data[currentIndex + 1];
            const dayC = data[nextIndex];
            // Loose: Only check if Day C matches. Day B is ignored
            if (dayB && dayC &&
                isConsecutive(data[currentIndex].date, dayB.date) &&
                isConsecutive(dayB.date, dayC.date) &&
                condition(dayC)) {
                streak.push(dayC);
                currentIndex = nextIndex;
            } else {
                break;
            }
        }

        if (streak.length >= 2) {
            const span = getDaySpan(streak[0].date, streak[streak.length - 1].date);
            if (span % 2 === 1) { // Số lẻ
                allStreaks.push(createStreakObject(data, dateMap, streak, { value: "Theo dạng" }));
            }
        }
    }
    return { description, streaks: allStreaks.filter(Boolean) };
}`;

// Replacing the code directly
code = code.replace(/function findAlternatingTypeStreaksNew[\s\S]*?return \{ streaks: allStreaks\.filter\(Boolean\) \};\n\}/, strictFunc);
code = code.replace(/function findAlternatingTypeStreaks\(data, dateMap, \{ condition, description \}\)[\s\S]*?return \{ description, streaks: allStreaks\.filter\(Boolean\) \};\n\}/, looseFunc);

fs.writeFileSync(file, code);
console.log('Fixed generators');
