const fs = require('fs');

async function fix() {
    const file = './services/headTailStatsGenerator.js';
    let code = fs.readFileSync(file, 'utf8');

    // Mốc cần sửa trong findAlternatingTypeStreaksNew:
    const searchRegex = /function findAlternatingTypeStreaksNew\(data, dateMap, numberMap\) \{[\s\S]*?return \{ streaks: allStreaks\.filter\(Boolean\) \};\n\}/;
    const replace = `function findAlternatingTypeStreaksNew(data, dateMap, { condition }) {
    const allStreaks = [];
    const processedStreaks = new Set();
    for (let i = 0; i < data.length - 2; i++) {
        const dayA = data[i];
        const dayB = data[i + 1];
        const dayC = data[i + 2];

        // Strict: Day A matches, Day C matches. Day B DOES NOT match.
        if (isConsecutive(dayA.date, dayB.date) && isConsecutive(dayB.date, dayC.date) &&
            condition(dayA) &&
            !condition(dayB) &&
            condition(dayC)) {

            const streakKey = \`\${dayA.date}\`;
            if (processedStreaks.has(streakKey)) continue;

            let streak = [dayA, dayC];
            let lastIndex = i + 2;

            while (lastIndex < data.length - 2) {
                const nextDay = data[lastIndex + 1];
                const nextStreakDay = data[lastIndex + 2];
                if (nextDay && nextStreakDay && isConsecutive(data[lastIndex].date, nextDay.date) && isConsecutive(nextDay.date, nextStreakDay.date) &&
                    !condition(nextDay) &&
                    condition(nextStreakDay)) {
                    streak.push(nextStreakDay);
                    lastIndex += 2;
                } else {
                    break;
                }
            }
            if (streak.length >= 2) {
                const span = getDaySpan(streak[0].date, streak[streak.length - 1].date);
                if (span % 2 === 1) {
                    const finalStreak = createStreakObject(data, dateMap, streak, { value: "Theo dạng" });
                    if (finalStreak) {
                        allStreaks.push(finalStreak);
                        streak.forEach(item => processedStreaks.add(\`\${item.date}\`));
                    }
                }
            }
        }
    }
    return { streaks: allStreaks.filter(Boolean) };
}`;

    if (searchRegex.test(code)) {
        code = code.replace(searchRegex, replace);
        console.log('Fixed findAlternatingTypeStreaksNew in headTailStatsGenerator.js');
    }

    // Now fix calls to findAlternatingTypeStreaksNew
    const searchCall1 = `...findAlternatingTypeStreaksNew(data, dateMap, MAPS[typeName])`;
    const replaceCall1 = `...findAlternatingTypeStreaksNew(data, dateMap, { condition: (a) => MAPS[typeName].has(a.value) })`;
    if (code.includes(searchCall1)) {
        code = code.replace(searchCall1, replaceCall1);
        console.log('Fixed basic pattern call');
    }

    const searchCall2 = `...findAlternatingTypeStreaksNew(lotteryData, dateToIndexMap, numberMap)`;
    const replaceCall2 = `...findAlternatingTypeStreaksNew(lotteryData, dateToIndexMap, { condition: typeCondition })`;
    // Wait, let's just make it regex if there are multiples
    code = code.replace(/\.\.\.findAlternatingTypeStreaksNew\(lotteryData, dateToIndexMap, numberMap\)/g, replaceCall2);

    fs.writeFileSync(file, code);
}

fix();
