// services/futureSimulationService.js
// Dịch vụ giả lập kết quả tương lai - Realistic Mode

const fs = require('fs');
const path = require('path');

class FutureSimulationService {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/xsmb-2-digits.json');
        // Cấu hình tiền cược
        this.BET_AMOUNT_PER_NUMBER = 10; // 10k/số
        this.WIN_MULTIPLIER = 70; // Thắng 70k nếu trúng 1 số với 10k
    }

    // Đọc dữ liệu lịch sử
    getHistoricalData() {
        try {
            const data = fs.readFileSync(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading historical data:', error);
            return [];
        }
    }

    // Sinh 1 số ngẫu nhiên duy nhất cho mỗi ngày (như thực tế xổ số)
    generateDailyWinningNumber() {
        return Math.floor(Math.random() * 100);
    }

    // Helper: Lấy giải đặc biệt từ một ngày (ưu tiên special > winningNumber > lo2so[0])
    getSpecialNumber(day) {
        if (day.special !== undefined) return day.special;
        if (day.winningNumber !== undefined) return day.winningNumber;
        if (day.lo2so && day.lo2so.length > 0) return day.lo2so[0];
        return null;
    }

    // Helper: Lấy Tổng Thập Thể (1-10)
    getTongTT(num) {
        const tong = Math.floor(num / 10) + (num % 10);
        return tong === 0 ? 10 : (tong > 10 ? tong - 10 : tong);
    }

    // Helper: Lấy Hiệu (0-9)
    getHieu(num) {
        return Math.abs(Math.floor(num / 10) - (num % 10));
    }

    // Helper: Lấy các số thuộc một dạng
    getNumbersForCategory(category, value) {
        const numbers = [];
        for (let i = 0; i < 100; i++) {
            if (category === 'dau' && Math.floor(i / 10) === value) numbers.push(i);
            else if (category === 'dit' && i % 10 === value) numbers.push(i);
            else if (category === 'tong' && this.getTongTT(i) === value) numbers.push(i);
            else if (category === 'hieu' && this.getHieu(i) === value) numbers.push(i);
        }
        return numbers;
    }

    // Helper: Tính chuỗi liên tiếp dựa trên giải đặc biệt (special)
    calculateStreakFromSpecial(data, checkFn) {
        let streak = 0;
        for (let i = data.length - 1; i >= 0; i--) {
            const special = this.getSpecialNumber(data[i]);
            if (special !== null && checkFn(special)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    // Helper: Tính gap cho mỗi số từ giải đặc biệt
    calculateGapFromSpecial(data) {
        const gapMap = new Map();
        for (let i = 0; i < 100; i++) gapMap.set(i, 100);

        for (let dayIndex = data.length - 1; dayIndex >= 0; dayIndex--) {
            const special = this.getSpecialNumber(data[dayIndex]);
            if (special !== null && gapMap.get(special) === 100) {
                gapMap.set(special, data.length - 1 - dayIndex);
            }
        }
        return gapMap;
    }

    // Helper: Tính thống kê gap cho một dạng số (avgGap, minGap)
    calculateCategoryGapStats(data, category, value) {
        const checkFn = (num) => {
            if (category === 'dau') return Math.floor(num / 10) === value;
            if (category === 'dit') return num % 10 === value;
            if (category === 'tong') return this.getTongTT(num) === value;
            if (category === 'hieu') return this.getHieu(num) === value;
            return false;
        };

        // Tìm tất cả các chuỗi trong lịch sử
        const gaps = [];
        let lastAppearance = -1;

        for (let i = 0; i < data.length; i++) {
            const special = this.getSpecialNumber(data[i]);

            if (special !== null && checkFn(special)) {
                if (lastAppearance >= 0) {
                    gaps.push(i - lastAppearance);
                }
                lastAppearance = i;
            }
        }

        if (gaps.length === 0) return { avgGap: 100, minGap: 100, count: 0 };

        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const minGap = Math.min(...gaps);
        const lastGap = lastAppearance >= 0 ? data.length - 1 - lastAppearance : 100;

        return { avgGap, minGap, lastGap, count: gaps.length };
    }

    // Phương pháp loại trừ (dựa vào giải đặc biệt + chuỗi + gap)
    exclusionMethod(historicalData) {
        const recentData = historicalData.slice(-90); // 90 ngày gần nhất
        const excluded = new Set();
        const streakInfo = [];

        // Tính gap cho mỗi số từ giải đặc biệt
        const gapMap = this.calculateGapFromSpecial(recentData);

        // ===== BƯỚC 1: Kiểm tra chuỗi ĐẦU về liên tiếp =====
        for (let val = 0; val <= 9; val++) {
            const streak = this.calculateStreakFromSpecial(recentData, n => Math.floor(n / 10) === val);
            const gapStats = this.calculateCategoryGapStats(recentData, 'dau', val);

            // Loại trừ nếu: có chuỗi >= 1 VÀ lastGap < avgGap (đang trong chu kỳ)
            if (streak >= 1 && gapStats.lastGap !== undefined && gapStats.lastGap < gapStats.avgGap) {
                const nums = this.getNumbersForCategory('dau', val);
                // Loại số có gap thấp (vừa về gần đây trong dạng này)
                nums.filter(n => gapMap.get(n) < gapStats.avgGap)
                    .forEach(n => {
                        excluded.add(n);
                        streakInfo.push({ type: `Đầu ${val} chuỗi`, streak, num: n });
                    });
            }
        }

        // ===== BƯỚC 2: Kiểm tra chuỗi ĐÍT về liên tiếp =====
        for (let val = 0; val <= 9; val++) {
            const streak = this.calculateStreakFromSpecial(recentData, n => n % 10 === val);
            const gapStats = this.calculateCategoryGapStats(recentData, 'dit', val);

            if (streak >= 1 && gapStats.lastGap !== undefined && gapStats.lastGap < gapStats.avgGap) {
                const nums = this.getNumbersForCategory('dit', val);
                nums.filter(n => gapMap.get(n) < gapStats.avgGap)
                    .forEach(n => {
                        excluded.add(n);
                        streakInfo.push({ type: `Đít ${val} chuỗi`, streak, num: n });
                    });
            }
        }

        // ===== BƯỚC 3: Kiểm tra chuỗi TỔNG về liên tiếp =====
        for (let val = 1; val <= 10; val++) {
            const streak = this.calculateStreakFromSpecial(recentData, n => this.getTongTT(n) === val);
            const gapStats = this.calculateCategoryGapStats(recentData, 'tong', val);

            if (streak >= 1 && gapStats.lastGap !== undefined && gapStats.lastGap < gapStats.avgGap) {
                const nums = this.getNumbersForCategory('tong', val);
                nums.filter(n => gapMap.get(n) < gapStats.avgGap)
                    .forEach(n => {
                        excluded.add(n);
                        streakInfo.push({ type: `Tổng ${val} chuỗi`, streak, num: n });
                    });
            }
        }

        // ===== BƯỚC 4: Kiểm tra chuỗi HIỆU về liên tiếp =====
        for (let val = 0; val <= 9; val++) {
            const streak = this.calculateStreakFromSpecial(recentData, n => this.getHieu(n) === val);
            const gapStats = this.calculateCategoryGapStats(recentData, 'hieu', val);

            if (streak >= 1 && gapStats.lastGap !== undefined && gapStats.lastGap < gapStats.avgGap) {
                const nums = this.getNumbersForCategory('hieu', val);
                nums.filter(n => gapMap.get(n) < gapStats.avgGap)
                    .forEach(n => {
                        excluded.add(n);
                        streakInfo.push({ type: `Hiệu ${val} chuỗi`, streak, num: n });
                    });
            }
        }

        // ===== BƯỚC 5: Loại trừ số về liên tiếp (cùng 1 số) =====
        for (let num = 0; num < 100; num++) {
            const streak = this.calculateStreakFromSpecial(recentData, n => n === num);
            if (streak >= 2) {
                excluded.add(num);
                streakInfo.push({ type: `Số ${String(num).padStart(2, '0')} về liên tiếp`, streak, num });
            }
        }

        // ===== BƯỚC 6: Loại trừ từ gap (bổ sung để đủ mục tiêu) =====
        // Số đã loại từ chuỗi (bước 1-5)
        const excludedFromStreak = excluded.size;

        // Số loại trừ mục tiêu thay đổi: nếu chuỗi loại nhiều → target cao hơn
        // Cơ sở: 60 số, cộng thêm 50% số loại từ chuỗi
        const TARGET_EXCLUDED = Math.min(60 + Math.floor(excludedFromStreak * 0.5), 80);
        const remainingToExclude = TARGET_EXCLUDED - excluded.size;

        if (remainingToExclude > 0) {
            // Sắp xếp các số còn lại theo gap tăng dần (loại số gap thấp trước)
            const remaining = [];
            for (let i = 0; i < 100; i++) {
                if (!excluded.has(i)) {
                    remaining.push({ num: i, gap: gapMap.get(i) });
                }
            }
            remaining.sort((a, b) => a.gap - b.gap);

            // Loại thêm đủ số để đạt mục tiêu
            for (let i = 0; i < Math.min(remainingToExclude, remaining.length); i++) {
                const item = remaining[i];
                excluded.add(item.num);
                streakInfo.push({ type: `Gap thấp`, num: item.num, gap: item.gap });
            }
        }

        // ===== BƯỚC 7: Tính số đánh =====
        const toBet = [];
        for (let i = 0; i < 100; i++) {
            if (!excluded.has(i)) toBet.push(i);
        }

        // Sắp xếp theo gap giảm dần (lâu chưa về ưu tiên)
        toBet.sort((a, b) => gapMap.get(b) - gapMap.get(a));

        // Số đánh = số còn lại sau khi loại trừ
        // Nếu quá nhiều (>40), chỉ lấy 40 số có gap cao nhất
        // Nếu quá ít (<20), nới lỏng điều kiện
        let finalToBet = toBet;
        const targetMin = 20;
        const targetMax = 40;

        if (toBet.length > targetMax) {
            // Lấy targetMax số có gap cao nhất
            finalToBet = toBet.slice(0, targetMax);
        } else if (toBet.length < targetMin) {
            // Nếu loại trừ quá nhiều (>80 số), chỉ giữ loại trừ số về liên tiếp
            excluded.clear();
            for (let num = 0; num < 100; num++) {
                const streak = this.calculateStreakFromSpecial(recentData, n => n === num);
                if (streak >= 2) excluded.add(num);
            }
            finalToBet = [];
            for (let i = 0; i < 100; i++) {
                if (!excluded.has(i)) finalToBet.push(i);
            }
            finalToBet.sort((a, b) => gapMap.get(b) - gapMap.get(a));
            if (finalToBet.length > targetMax) finalToBet = finalToBet.slice(0, targetMax);
        }
        // Nếu trong khoảng 20-40, giữ nguyên số đánh dựa trên loại trừ thực tế

        return {
            toBet: finalToBet,
            excluded: Array.from(excluded),
            streakInfo
        };
    }

    // Phương pháp Unified (Gap + Tần suất + Chu kỳ)
    unifiedMethod(historicalData) {
        const recentData = historicalData.slice(-60);
        const gapMap = new Map();
        const freqMap = new Map();
        const cycleMap = new Map(); // Theo dõi chu kỳ xuất hiện

        for (let i = 0; i < 100; i++) {
            gapMap.set(i, 100);
            freqMap.set(i, 0);
            cycleMap.set(i, []);
        }

        // Tính gap, tần suất và chu kỳ từ GIẢI ĐẶC BIỆT
        for (let dayIndex = recentData.length - 1; dayIndex >= 0; dayIndex--) {
            const special = this.getSpecialNumber(recentData[dayIndex]);
            if (special === null) continue;

            const currentGap = gapMap.get(special);
            if (currentGap === 100) {
                gapMap.set(special, recentData.length - 1 - dayIndex);
            } else if (cycleMap.get(special).length < 3) {
                // Lưu chu kỳ (khoảng cách giữa các lần xuất hiện)
                cycleMap.get(special).push(recentData.length - 1 - dayIndex);
            }
            freqMap.set(special, freqMap.get(special) + 1);
        }

        // Tính điểm: ưu tiên số có tần suất cao + gap vừa phải (5-15)
        const scores = new Map();
        for (let i = 0; i < 100; i++) {
            const gap = gapMap.get(i);
            const freq = freqMap.get(i);

            // Điểm dựa vào: tần suất * 3 + gap bonus (gap 8-15 được ưu tiên)
            let gapBonus = 0;
            if (gap >= 8 && gap <= 15) gapBonus = 30;
            else if (gap >= 5 && gap < 8) gapBonus = 20;
            else if (gap > 15 && gap <= 25) gapBonus = 10;

            scores.set(i, freq * 3 + gapBonus + Math.random() * 5);
        }

        const sortedByScore = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        return {
            toBet: sortedByScore.slice(0, 25),
            excluded: sortedByScore.slice(75)
        };
    }

    // Phương pháp Advanced (Pattern + Gap + Cycle)
    advancedMethod(historicalData) {
        const recentData = historicalData.slice(-90);
        const scores = new Map();

        for (let i = 0; i < 100; i++) {
            scores.set(i, 0);
        }

        // Phân tích pattern (số đầu/đít) từ GIẢI ĐẶC BIỆT
        const last10 = recentData.slice(-10);
        const dauPattern = new Set();
        const ditPattern = new Set();

        last10.forEach(day => {
            const special = this.getSpecialNumber(day);
            if (special !== null) {
                dauPattern.add(Math.floor(special / 10));
                ditPattern.add(special % 10);
            }
        });

        // Cho điểm các số có đầu/đít khác với pattern gần đây
        for (let i = 0; i < 100; i++) {
            const dau = Math.floor(i / 10);
            const dit = i % 10;

            if (!dauPattern.has(dau)) scores.set(i, scores.get(i) + 20);
            if (!ditPattern.has(dit)) scores.set(i, scores.get(i) + 20);

            // Random factor để đa dạng hóa
            scores.set(i, scores.get(i) + Math.random() * 30);
        }

        const sortedByScore = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        return {
            toBet: sortedByScore.slice(0, 25),
            excluded: sortedByScore.slice(75)
        };
    }

    // Phương pháp Hybrid AI (Markov-like + Monte Carlo-like)
    hybridAIMethod(historicalData) {
        const recentData = historicalData.slice(-100);
        const scores = new Map();
        const transitionProb = new Map();

        for (let i = 0; i < 100; i++) {
            scores.set(i, 0);
        }

        // Giả lập Markov: số nào hay về sau số nào (từ GIẢI ĐẶC BIỆT)
        for (let i = 1; i < recentData.length; i++) {
            const prevSpecial = this.getSpecialNumber(recentData[i - 1]);
            const currSpecial = this.getSpecialNumber(recentData[i]);

            if (prevSpecial !== null && currSpecial !== null) {
                const key = `${prevSpecial}-${currSpecial}`;
                transitionProb.set(key, (transitionProb.get(key) || 0) + 1);
            }
        }

        // Tính xác suất cho ngày tiếp theo
        const lastDay = recentData[recentData.length - 1];
        const lastSpecial = this.getSpecialNumber(lastDay);

        if (lastSpecial !== null) {
            for (let i = 0; i < 100; i++) {
                const key = `${lastSpecial}-${i}`;
                scores.set(i, scores.get(i) + (transitionProb.get(key) || 0));
            }
        }

        // Monte Carlo factor
        for (let i = 0; i < 100; i++) {
            scores.set(i, scores.get(i) + Math.random() * 20);
        }

        const sortedByScore = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        return {
            toBet: sortedByScore.slice(0, 25),
            excluded: sortedByScore.slice(75)
        };
    }

    // Phương pháp Combined (Tổng hợp cả 4 phương pháp)
    // Logic: Lấy Union của 4 PP, loại số có count >= 2, đánh số còn lại (count === 1)
    combinedMethod(historicalData) {
        // Lấy dự đoán từ 4 phương pháp
        const exclusion = this.exclusionMethod(historicalData);
        const unified = this.unifiedMethod(historicalData);
        const advanced = this.advancedMethod(historicalData);
        const hybridAI = this.hybridAIMethod(historicalData);

        // Đếm số lần xuất hiện của mỗi số trong các phương pháp
        const countMap = new Map();
        for (let i = 0; i < 100; i++) {
            countMap.set(i, 0);
        }

        // Cộng điểm cho mỗi số xuất hiện trong toBet của các phương pháp
        [exclusion, unified, advanced, hybridAI].forEach(method => {
            method.toBet.forEach(num => {
                countMap.set(num, countMap.get(num) + 1);
            });
        });

        // Lấy các số trong UNION (count >= 1) nhưng loại số trùng (count >= 2)
        // → Chỉ đánh số có count === 1 (xuất hiện trong đúng 1 phương pháp)
        const toBet = [];
        for (let i = 0; i < 100; i++) {
            if (countMap.get(i) === 1) {
                toBet.push(i);
            }
        }

        // Số loại trừ = số không có trong union (count === 0) + số trùng (count >= 2)
        const excludedSet = new Set();
        for (let i = 0; i < 100; i++) {
            if (countMap.get(i) !== 1) {
                excludedSet.add(i);
            }
        }

        return {
            toBet: toBet,
            excluded: Array.from(excludedSet),
            methodDetails: {
                exclusion: exclusion.toBet.length,
                unified: unified.toBet.length,
                advanced: advanced.toBet.length,
                hybridAI: hybridAI.toBet.length,
                unique: toBet.length
            }
        };
    }

    // Combined từ 4 predictions đã tính sẵn (không gọi lại 4 phương pháp)
    // Giải quyết vấn đề HybridAI có random nên kết quả khác nhau mỗi lần gọi
    combinedMethodFromPredictions(exclusion, unified, advanced, hybridAI) {
        // Đếm số lần xuất hiện của mỗi số trong các phương pháp
        const countMap = new Map();
        for (let i = 0; i < 100; i++) {
            countMap.set(i, 0);
        }

        // Cộng điểm cho mỗi số xuất hiện trong toBet của các phương pháp
        [exclusion, unified, advanced, hybridAI].forEach(method => {
            method.toBet.forEach(num => {
                countMap.set(num, countMap.get(num) + 1);
            });
        });

        // Lấy các số trong UNION (count >= 1) nhưng loại số trùng (count >= 2)
        // → Chỉ đánh số có count === 1 (xuất hiện trong đúng 1 phương pháp)
        const toBet = [];
        for (let i = 0; i < 100; i++) {
            if (countMap.get(i) === 1) {
                toBet.push(i);
            }
        }

        // Số loại trừ = số không có trong union (count === 0) + số trùng (count >= 2)
        const excludedSet = new Set();
        for (let i = 0; i < 100; i++) {
            if (countMap.get(i) !== 1) {
                excludedSet.add(i);
            }
        }

        return {
            toBet: toBet,
            excluded: Array.from(excludedSet),
            methodDetails: {
                exclusion: exclusion.toBet.length,
                unified: unified.toBet.length,
                advanced: advanced.toBet.length,
                hybridAI: hybridAI.toBet.length,
                unique: toBet.length
            }
        };
    }

    // Tính tiền thắng/thua cho 1 ngày
    calculateDayProfit(prediction, winningNumber, betAmount = this.BET_AMOUNT_PER_NUMBER) {
        const numBets = prediction.toBet.length;
        const totalBet = numBets * betAmount;
        const isWin = prediction.toBet.includes(winningNumber);
        const winAmount = isWin ? betAmount * this.WIN_MULTIPLIER : 0;
        const profit = winAmount - totalBet;

        return {
            winningNumber,
            isWin,
            numBets,
            betAmount,
            totalBet,
            winAmount,
            profit,
            toBet: prediction.toBet,
            excluded: prediction.excluded
        };
    }

    // Chạy simulation cho khoảng thời gian với chiến lược gấp thếp
    async runSimulation(duration = 'week', initialBetAmount = 10, betStep = 5) {
        const days = {
            'week': 7,
            'month': 30,
            '3months': 90,
            'year': 365
        };

        const numDays = days[duration] || 7;
        const historicalData = this.getHistoricalData();

        // Clone dữ liệu để không ảnh hưởng dữ liệu gốc
        let simulatedHistory = [...historicalData];

        const results = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);

        // Stats cho từng phương pháp - bao gồm mức cược hiện tại và tổng lỗ tích lũy
        const methodStats = {
            exclusion: {
                wins: 0, losses: 0, totalBet: 0, totalWin: 0, dailyProfits: [],
                currentBetAmount: initialBetAmount, // Mức cược hiện tại
                accumulatedLoss: 0, // Tổng lỗ tích lũy (cần bù)
                betHistory: [] // Lịch sử mức cược
            },
            unified: {
                wins: 0, losses: 0, totalBet: 0, totalWin: 0, dailyProfits: [],
                currentBetAmount: initialBetAmount,
                accumulatedLoss: 0,
                betHistory: []
            },
            advanced: {
                wins: 0, losses: 0, totalBet: 0, totalWin: 0, dailyProfits: [],
                currentBetAmount: initialBetAmount,
                accumulatedLoss: 0,
                betHistory: []
            },
            hybridAI: {
                wins: 0, losses: 0, totalBet: 0, totalWin: 0, dailyProfits: [],
                currentBetAmount: initialBetAmount,
                accumulatedLoss: 0,
                betHistory: []
            },
            combined: {
                wins: 0, losses: 0, totalBet: 0, totalWin: 0, dailyProfits: [],
                currentBetAmount: initialBetAmount,
                accumulatedLoss: 0,
                betHistory: []
            }
        };

        // Weekly/Monthly stats
        const weeklyStats = {};
        const monthlyStats = {};

        for (let i = 0; i < numDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];

            // Week/Month key
            const weekNum = Math.floor(i / 7);
            const monthNum = Math.floor(i / 30);

            // Sinh 1 số duy nhất cho ngày này
            const winningNumber = this.generateDailyWinningNumber();

            // Tạo dự đoán cho ngày này - tính 4 phương pháp trước
            const exclusionPred = this.exclusionMethod(simulatedHistory);
            const unifiedPred = this.unifiedMethod(simulatedHistory);
            const advancedPred = this.advancedMethod(simulatedHistory);
            const hybridAIPred = this.hybridAIMethod(simulatedHistory);

            // Combined: sử dụng kết quả từ 4 phương pháp đã tính (không gọi lại)
            const combinedPred = this.combinedMethodFromPredictions(exclusionPred, unifiedPred, advancedPred, hybridAIPred);

            const predictions = {
                exclusion: exclusionPred,
                unified: unifiedPred,
                advanced: advancedPred,
                hybridAI: hybridAIPred,
                combined: combinedPred
            };

            const dayResults = {
                date: dateStr,
                dayIndex: i + 1,
                weekNum: weekNum + 1,
                monthNum: monthNum + 1,
                winningNumber: String(winningNumber).padStart(2, '0'),
                methods: {}
            };

            for (const [method, prediction] of Object.entries(predictions)) {
                const stats = methodStats[method];

                // Lấy mức cược cho ngày này (đã tính từ ngày trước)
                const todayBetAmount = stats.currentBetAmount;

                // Tính kết quả với mức cược hiện tại
                const result = this.calculateDayProfit(prediction, winningNumber, todayBetAmount);

                // Thêm thông tin mức cược vào kết quả
                result.betAmountUsed = todayBetAmount;
                dayResults.methods[method] = result;

                // Cập nhật stats
                if (result.isWin) {
                    stats.wins++;
                    // THẮNG: Reset về mức cược ban đầu và xóa tổng lỗ
                    stats.accumulatedLoss = 0;
                    stats.currentBetAmount = initialBetAmount;
                } else {
                    stats.losses++;
                    // THUA: Cộng dồn lỗ và tính mức cược mới để bù toàn bộ chuỗi thua
                    stats.accumulatedLoss += result.totalBet;

                    // Công thức tính mức cược để bù lỗ + có lãi:
                    // Lãi mỗi số nếu thắng = (70 - 40) * betAmount = 30 * betAmount
                    // Để bù (tổng lỗ + lãi mong muốn betStep*40), cần:
                    // betAmount = (accumulatedLoss + minProfit) / 30
                    // Làm tròn lên theo bước nhảy
                    const minProfit = betStep * 40; // Lãi tối thiểu mong muốn
                    const neededBetAmount = Math.ceil((stats.accumulatedLoss + minProfit) / 30);
                    // Làm tròn lên theo betStep
                    stats.currentBetAmount = Math.ceil(neededBetAmount / betStep) * betStep;
                    // Đảm bảo ít nhất = initialBetAmount
                    if (stats.currentBetAmount < initialBetAmount) {
                        stats.currentBetAmount = initialBetAmount;
                    }
                }

                // Lưu lịch sử mức cược
                stats.betHistory.push({
                    date: dateStr,
                    betAmount: todayBetAmount,
                    nextBetAmount: stats.currentBetAmount,
                    accumulatedLoss: stats.accumulatedLoss
                });

                stats.totalBet += result.totalBet;
                stats.totalWin += result.winAmount;
                stats.dailyProfits.push({
                    date: dateStr,
                    profit: result.profit,
                    betAmount: todayBetAmount,
                    cumulative: (stats.dailyProfits[stats.dailyProfits.length - 1]?.cumulative || 0) + result.profit
                });

                // Weekly stats
                if (!weeklyStats[weekNum]) weeklyStats[weekNum] = {};
                if (!weeklyStats[weekNum][method]) {
                    weeklyStats[weekNum][method] = { wins: 0, losses: 0, totalBet: 0, totalWin: 0, profit: 0 };
                }
                const ws = weeklyStats[weekNum][method];
                if (result.isWin) ws.wins++; else ws.losses++;
                ws.totalBet += result.totalBet;
                ws.totalWin += result.winAmount;
                ws.profit += result.profit;

                // Monthly stats
                if (!monthlyStats[monthNum]) monthlyStats[monthNum] = {};
                if (!monthlyStats[monthNum][method]) {
                    monthlyStats[monthNum][method] = { wins: 0, losses: 0, totalBet: 0, totalWin: 0, profit: 0 };
                }
                const ms = monthlyStats[monthNum][method];
                if (result.isWin) ms.wins++; else ms.losses++;
                ms.totalBet += result.totalBet;
                ms.totalWin += result.winAmount;
                ms.profit += result.profit;
            }

            results.push(dayResults);

            // Thêm số về vào lịch sử giả lập (với field special để các phương pháp sử dụng)
            simulatedHistory.push({
                date: dateStr,
                special: winningNumber, // Giải đặc biệt (như dữ liệu thực)
                lo2so: [winningNumber],
                winningNumber: winningNumber
            });
        }

        // Tính summary
        const summary = {};
        for (const [method, stats] of Object.entries(methodStats)) {
            const totalProfit = stats.totalWin - stats.totalBet;
            const maxBet = Math.max(...stats.betHistory.map(h => h.betAmount));
            const maxAccumulatedLoss = Math.max(...stats.betHistory.map(h => h.accumulatedLoss), 0);

            summary[method] = {
                totalDays: numDays,
                wins: stats.wins,
                losses: stats.losses,
                winRate: ((stats.wins / numDays) * 100).toFixed(1) + '%',
                totalBet: stats.totalBet,
                totalWin: stats.totalWin,
                totalProfit: totalProfit,
                roi: ((totalProfit / stats.totalBet) * 100).toFixed(2) + '%',
                avgDailyProfit: (totalProfit / numDays).toFixed(0),
                // Thông tin gấp thếp
                initialBetAmount: initialBetAmount,
                betStep: betStep,
                maxBetAmount: maxBet,
                maxAccumulatedLoss: maxAccumulatedLoss,
                finalBetAmount: stats.currentBetAmount,
                dailyProfits: stats.dailyProfits,
                betHistory: stats.betHistory
            };
        }

        // Chart data for frontend
        const chartData = {
            labels: results.map(r => r.date),
            winningNumbers: results.map(r => r.winningNumber),
            methods: {}
        };

        for (const method of Object.keys(methodStats)) {
            chartData.methods[method] = {
                dailyProfit: methodStats[method].dailyProfits.map(d => d.profit),
                cumulativeProfit: methodStats[method].dailyProfits.map(d => d.cumulative),
                betAmounts: methodStats[method].dailyProfits.map(d => d.betAmount),
                isWin: results.map(r => r.methods[method].isWin)
            };
        }

        return {
            duration,
            numDays,
            initialBetAmount,
            betStep,
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date(startDate.getTime() + (numDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            results: results.slice(0, 50), // Limit for response size
            summary,
            weeklyStats,
            monthlyStats,
            chartData,
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = new FutureSimulationService();
