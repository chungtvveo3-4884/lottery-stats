const fs = require('fs');
let code = fs.readFileSync('./services/statisticsService.js', 'utf8');

// 1. Fix getFilteredStreaks
const search1 = `    if (filters.minLength && filters.minLength !== 'all') {
        finalStreaks = finalStreaks.filter(s => s.length >= filters.minLength);
    }

    return {
        description: statsData.description,
        streaks: finalStreaks
    };`;
const replace1 = `    if (filters.minLength && filters.minLength !== 'all') {
        finalStreaks = finalStreaks.filter(s => s.length == filters.minLength);
    }

    try {
        const { predictNextInSequence } = require('../controllers/suggestionsController');
        finalStreaks = finalStreaks.map(streak => {
            const statObj = { current: { values: streak.values.map(String) } };
            const nums = predictNextInSequence(statObj, category, subcategory || '');
            return { ...streak, patternNumbers: nums };
        });
    } catch(e) {
        console.error('Error attaching patternNumbers in getFilteredStreaks:', e);
    }

    return {
        description: statsData.description,
        streaks: finalStreaks
    };`;
code = code.replace(search1, replace1);

// 2. Fix the getQuickStats soLe logic
const search2 = `            if (isSoLe) {
                // Với dạng so le: Chỉ lấy chuỗi kết thúc 1 ngày trước
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = \`\${String(yesterday.getDate()).padStart(2, '0')}/\${String(yesterday.getMonth() + 1).padStart(2, '0')}/\${yesterday.getFullYear()}\`;
                
                let streak = categoryData.streaks.find(s => s.endDate === yesterdayStr);
                
                if (streak) {
                    current = {
                        ...streak,
                        fullSequence: streak.fullSequence ? [...streak.fullSequence] : []
                    };

                    // Thêm ngày hôm nay vào fullSequence (để hiển thị, nhưng KHÔNG dùng cho dự đoán)
                    if (latestLotteryDay && latestLotteryDay.special) {
                        current.fullSequence.push({
                            date: latestDate,
                            value: String(latestLotteryDay.special).padStart(2, '0'),
                            isLatest: true // Đánh dấu là ngày mới nhất (KHÔNG thuộc chuỗi)
                        });
                    }
                }
            } else if (isTienLuiSoLe) {`;

const replace2 = `            if (isSoLe) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = \`\${String(yesterday.getDate()).padStart(2, '0')}/\${String(yesterday.getMonth() + 1).padStart(2, '0')}/\${yesterday.getFullYear()}\`;
                
                let streak = categoryData.streaks.find(s => s.endDate === latestDate);
                let isWaitingDay = false;

                if (!streak) {
                    streak = categoryData.streaks.find(s => s.endDate === yesterdayStr);
                    isWaitingDay = true;
                }

                if (streak) {
                    const isNewPattern = key.toLowerCase().includes('solemoi');
                    let isBroken = false;
                    
                    if (isWaitingDay && latestLotteryDay && latestLotteryDay.special && isNewPattern) {
                        const { identifyCategories } = require('../utils/numberAnalysis');
                        const numStr = String(latestLotteryDay.special).padStart(2, '0');
                        const cats = identifyCategories(numStr);
                        const [c] = key.split(':');
                        
                        const lastValue = streak.values[streak.values.length - 1];
                        if (c === 'motSo' && numStr === lastValue) isBroken = true;
                        else if (c === 'motDau' && numStr[0] === lastValue[0]) isBroken = true;
                        else if (c === 'motDit' && numStr[1] === lastValue[1]) isBroken = true;
                        else if (cats.includes(c)) isBroken = true;
                    }

                    if (!isBroken) {
                        current = {
                            ...streak,
                            fullSequence: streak.fullSequence ? [...streak.fullSequence] : []
                        };

                        if (isWaitingDay && latestLotteryDay && latestLotteryDay.special) {
                            current.fullSequence.push({
                                date: latestDate,
                                value: String(latestLotteryDay.special).padStart(2, '0'),
                                isLatest: true
                            });
                        }
                    }
                }
            } else if (isTienLuiSoLe) {`;
code = code.replace(search2, replace2);

// 3. Add patternNumbers generation at the end of analyzeCategory
const search3 = `    for (const key in allStats) {
        const categoryData = allStats[key];`;

const replace3 = `        // [MỚI] Dùng logic predictNextInSequence để lấy pattern numbers chuẩn (chạy sau khi mọi current đã hình thành)
        if (quickStats[key] && quickStats[key].current) {
            try {
                const { predictNextInSequence } = require('../controllers/suggestionsController');
                const [categoryName, subcategoryStr] = key.split(':');
                const statObj = { current: quickStats[key].current };
                const nums = predictNextInSequence(statObj, categoryName, subcategoryStr || '');
                if (nums && nums.length > 0) {
                    quickStats[key].current.patternNumbers = nums;
                }
            } catch (e) {
                console.error('Lỗi khi lấy danh sách số cho pattern', key, e);
            }
        }
    };

    for (const key in allStats) {
        const categoryData = allStats[key];`;
code = code.replace(search3, replace3);

fs.writeFileSync('./services/statisticsService.js', code);
console.log('Fixed services/statisticsService.js entirely!');
