const fs = require('fs');

async function fix() {
    const file = './services/statisticsService.js';
    let code = fs.readFileSync(file, 'utf8');

    // Mốc cho: "if (isSoLe) {"
    const search = `            if (isSoLe) {
                // Với so le: Chỉ lấy chuỗi có endDate = latestDate - 1 (ngày hôm qua)
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = \`\${String(yesterday.getDate()).padStart(2, '0')}/\${String(yesterday.getMonth() + 1).padStart(2, '0')}/\${yesterday.getFullYear()}\`;

                const streak = categoryData.streaks.find(s => s.endDate === yesterdayStr);
                if (streak) {
                    // CRITICAL FIX: Deep copy fullSequence to avoid modifying the cached object
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
            }`;

    const replace = `            if (isSoLe) {
                // Với so le mới: 
                // Có 2 trường hợp chuỗi đang diễn ra:
                // 1. Kết thúc 2 ngày trước (Hôm nay sẽ là ngày tiếp theo của pattern)
                // 2. Kết thúc hôm qua (Hôm nay là ngày xen kẽ, chờ KQ xem có bị gãy không)
                const twoDaysAgo = new Date(today);
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                const twoDaysAgoStr = \`\${String(twoDaysAgo.getDate()).padStart(2, '0')}/\${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}/\${twoDaysAgo.getFullYear()}\`;
                
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = \`\${String(yesterday.getDate()).padStart(2, '0')}/\${String(yesterday.getMonth() + 1).padStart(2, '0')}/\${yesterday.getFullYear()}\`;

                let streak = categoryData.streaks.find(s => s.endDate === twoDaysAgoStr);
                let isWaitingDay = false;

                if (!streak) {
                    streak = categoryData.streaks.find(s => s.endDate === yesterdayStr);
                    isWaitingDay = true;
                }

                if (streak) {
                    // CRITICAL BUG FIX: Kiểm tra xem ngày xen kẽ có vi phạm pattern không!
                    // Nếu hôm nay là ngày xen kẽ (kết thúc hôm qua) và có KQ hôm nay,
                    // thì KQ hôm nay KHÔNG ĐƯỢC trùng với pattern! NẾU trùng = GÃY chuỗi.
                    const isNewPattern = key.toLowerCase().includes('solemoi');
                    let isBroken = false;
                    
                    if (isWaitingDay && latestLotteryDay && latestLotteryDay.special && isNewPattern) {
                        const { identifyCategories } = require('../utils/numberAnalysis');
                        const numStr = String(latestLotteryDay.special).padStart(2, '0');
                        const cats = identifyCategories(numStr);
                        const [c] = key.split(':'); // Lấy category, vd 'dau_chan'
                        
                        // Nếu numberMap của pattern có chứa giá trị ngày xen kẽ, thì pattern xen kẽ bị gãy
                        // Đối với 1Dau, 1Dit, 1So...
                        const lastValue = streak.values[streak.values.length - 1];
                        if (c === 'motSo' && numStr === lastValue) isBroken = true;
                        else if (c === 'motDau' && numStr[0] === lastValue[0]) isBroken = true;
                        else if (c === 'motDit' && numStr[1] === lastValue[1]) isBroken = true;
                        else if (cats.includes(c)) {
                            // Cùng category
                            isBroken = true;
                        }
                    }

                    if (!isBroken) {
                        current = {
                            ...streak,
                            fullSequence: streak.fullSequence ? [...streak.fullSequence] : []
                        };

                        // Thêm ngày hôm nay vào fullSequence (để hiển thị)
                        if (latestLotteryDay && latestLotteryDay.special) {
                            current.fullSequence.push({
                                date: latestDate,
                                value: String(latestLotteryDay.special).padStart(2, '0'),
                                isLatest: true // Đánh dấu là ngày xen kẽ hoặc ngày chờ
                            });
                        }
                    }
                }
            }`;

    if (code.includes(search)) {
        code = code.replace(search, replace);
        fs.writeFileSync(file, code);
        console.log('Fixed statisticsService.js');
    } else {
        console.log('Could not find search string in statisticsService.js');
    }
}

fix();
