// services/simulationService.js
const { scoringForms } = require('../utils/lotteryScoring');

/**
 * Chạy mô phỏng dựa trên các tùy chọn từ người dùng.
 * @param {object} options - Các tùy chọn mô phỏng.
 * @returns {object} - Kết quả mô phỏng.
 */
function runSimulation(options) {
    const {
        simulationDays,
        initialCapital,
        formGroups: clientFormGroups
    } = options;

    if (!simulationDays || !initialCapital || !clientFormGroups || clientFormGroups.length === 0) {
        throw new Error('Thiếu thông số để chạy mô phỏng.');
    }

    const days = parseInt(simulationDays, 10);
    const capital = parseInt(initialCapital, 10);
    const winRate = 99; // Tỷ lệ trả thưởng

    // Chuẩn bị dữ liệu các dạng chơi với đầy đủ thông tin (bao gồm checkFunction)
    const formGroups = clientFormGroups.map(group => {
        const selectedForm = scoringForms.find(f => f.n === group.formN);
        if (!selectedForm) {
            throw new Error(`Không tìm thấy dạng số: ${group.formN}`);
        }
        const numbers = Array.from({ length: 100 }, (_, i) => i).filter(num => selectedForm.checkFunction(num));
        return {
            form: selectedForm,
            betAmount: parseInt(group.betAmount, 10),
            numbers
        };
    });
    
    const dailyResults = [];
    let currentCapital = capital;

    for (let day = 1; day <= days; day++) {
        const winningNumber = Math.floor(Math.random() * 100);
        let dailyBet = 0;
        let dailyWin = 0;

        formGroups.forEach(group => {
            dailyBet += group.numbers.length * group.betAmount;
            if (group.numbers.includes(winningNumber)) {
                dailyWin += group.betAmount * winRate;
            }
        });

        const dailyProfit = dailyWin - dailyBet;
        currentCapital += dailyProfit;

        dailyResults.push({
            day,
            winningNumber: String(winningNumber).padStart(2, '0'),
            dailyBet,
            dailyWin,
            dailyProfit,
            endCapital: currentCapital
        });
    }

    return { dailyResults, initialCapital: capital };
}

module.exports = { runSimulation };