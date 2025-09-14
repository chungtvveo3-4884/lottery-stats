const getAllNumbers = (day, mode = 'lo') => {
    // Hàm phụ trợ để chuẩn hóa số thành giá trị số và lấy 2 chữ số cuối
    const normalizeNumber = (num) => {
        if (num === undefined || num === null || isNaN(num)) return null;
        const numericValue = Number(num);
        return numericValue % 100; // Lấy 2 chữ số cuối
    };

    const numbers = {
        'de': [normalizeNumber(day.special)],
        'lo': [
            normalizeNumber(day.special),
            normalizeNumber(day.prize1),
            normalizeNumber(day.prize2_1), normalizeNumber(day.prize2_2),
            normalizeNumber(day.prize3_1), normalizeNumber(day.prize3_2), normalizeNumber(day.prize3_3),
            normalizeNumber(day.prize3_4), normalizeNumber(day.prize3_5), normalizeNumber(day.prize3_6),
            normalizeNumber(day.prize4_1), normalizeNumber(day.prize4_2), normalizeNumber(day.prize4_3),
            normalizeNumber(day.prize4_4),
            normalizeNumber(day.prize5_1), normalizeNumber(day.prize5_2), normalizeNumber(day.prize5_3),
            normalizeNumber(day.prize5_4), normalizeNumber(day.prize5_5), normalizeNumber(day.prize5_6),
            normalizeNumber(day.prize6_1), normalizeNumber(day.prize6_2), normalizeNumber(day.prize6_3),
            normalizeNumber(day.prize7_1), normalizeNumber(day.prize7_2), normalizeNumber(day.prize7_3),
            normalizeNumber(day.prize7_4)
        ],
        'prize1': [normalizeNumber(day.prize1)],
        'prize2': [normalizeNumber(day.prize2_1), normalizeNumber(day.prize2_2)],
        'prize3': [
            normalizeNumber(day.prize3_1), normalizeNumber(day.prize3_2), normalizeNumber(day.prize3_3),
            normalizeNumber(day.prize3_4), normalizeNumber(day.prize3_5), normalizeNumber(day.prize3_6)
        ],
        'prize4': [
            normalizeNumber(day.prize4_1), normalizeNumber(day.prize4_2),
            normalizeNumber(day.prize4_3), normalizeNumber(day.prize4_4)
        ],
        'prize5': [
            normalizeNumber(day.prize5_1), normalizeNumber(day.prize5_2), normalizeNumber(day.prize5_3),
            normalizeNumber(day.prize5_4), normalizeNumber(day.prize5_5), normalizeNumber(day.prize5_6)
        ],
        'prize6': [
            normalizeNumber(day.prize6_1), normalizeNumber(day.prize6_2), normalizeNumber(day.prize6_3)
        ],
        'prize7': [
            normalizeNumber(day.prize7_1), normalizeNumber(day.prize7_2),
            normalizeNumber(day.prize7_3), normalizeNumber(day.prize7_4)
        ],
        'pos1': [normalizeNumber(day.prize1)],
        'pos2': [normalizeNumber(day.prize2_1)],
        'pos3': [normalizeNumber(day.prize2_2)],
        'pos4': [normalizeNumber(day.prize3_1)],
        'pos5': [normalizeNumber(day.prize3_2)],
        'pos6': [normalizeNumber(day.prize3_3)],
        'pos7': [normalizeNumber(day.prize3_4)],
        'pos8': [normalizeNumber(day.prize3_5)],
        'pos9': [normalizeNumber(day.prize3_6)],
        'pos10': [normalizeNumber(day.prize4_1)],
        'pos11': [normalizeNumber(day.prize4_2)],
        'pos12': [normalizeNumber(day.prize4_3)],
        'pos13': [normalizeNumber(day.prize4_4)],
        'pos14': [normalizeNumber(day.prize5_1)],
        'pos15': [normalizeNumber(day.prize5_2)],
        'pos16': [normalizeNumber(day.prize5_3)],
        'pos17': [normalizeNumber(day.prize5_4)],
        'pos18': [normalizeNumber(day.prize5_5)],
        'pos19': [normalizeNumber(day.prize5_6)],
        'pos20': [normalizeNumber(day.prize6_1)],
        'pos21': [normalizeNumber(day.prize6_2)],
        'pos22': [normalizeNumber(day.prize6_3)],
        'pos23': [normalizeNumber(day.prize7_1)],
        'pos24': [normalizeNumber(day.prize7_2)],
        'pos25': [normalizeNumber(day.prize7_3)],
        'pos26': [normalizeNumber(day.prize7_4)]
    };
    return (numbers[mode] || numbers['lo'])
        .filter(num => num !== null);
};
// Hàm phụ trợ để lấy số theo mode
const getNumbersByMode = (day, mode) => {
     // [THÊM DÒNG NÀY VÀO ĐÂY] - Đảm bảo mode luôn là một chuỗi ký tự
    mode = String(mode || ''); 
    // Validate day object
    if (!day || !day.date) {
        console.warn('Invalid day object:', day);
        return [];
    }

    // Xử lý mode 'de' (giải đặc biệt)
    if (mode === 'de') {
        // Accept 0 as a valid special number, reject undefined, null, or non-numeric values
        if (day.special === undefined || day.special === null || isNaN(day.special)) {
            console.warn(`Invalid or missing special number for mode 'de' on date ${day.date}: ${day.special}`);
            return [];
        }
        const normalizedSpecial = Number(day.special) % 100;
        return [normalizedSpecial];
    }

    // Xử lý mode 'lo' (tất cả các số)
    if (mode === 'lo') {
        return getAllNumbers(day, mode);
    }

    // Xử lý mode 'prizeX' (trả về tất cả số của giải X)
    if (mode.startsWith('prize')) {
        const prizeNum = parseInt(mode.replace('prize', ''));
        switch (prizeNum) {
            case 1:
                return day.prize1 !== undefined && day.prize1 !== null ? [Number(day.prize1) % 100] : [];
            case 2:
                return [day.prize2_1, day.prize2_2]
                    .filter(num => num !== undefined && num !== null)
                    .map(num => Number(num) % 100);
            case 3:
                return [day.prize3_1, day.prize3_2, day.prize3_3, day.prize3_4, day.prize3_5, day.prize3_6]
                    .filter(num => num !== undefined && num !== null)
                    .map(num => Number(num) % 100);
            case 4:
                return [day.prize4_1, day.prize4_2, day.prize4_3, day.prize4_4]
                    .filter(num => num !== undefined && num !== null)
                    .map(num => Number(num) % 100);
            case 5:
                return [day.prize5_1, day.prize5_2, day.prize5_3, day.prize5_4, day.prize5_5, day.prize5_6]
                    .filter(num => num !== undefined && num !== null)
                    .map(num => Number(num) % 100);
            case 6:
                return [day.prize6_1, day.prize6_2, day.prize6_3]
                    .filter(num => num !== undefined && num !== null)
                    .map(num => Number(num) % 100);
            case 7:
                return [day.prize7_1, day.prize7_2, day.prize7_3, day.prize7_4]
                    .filter(num => num !== undefined && num !== null)
                    .map(num => Number(num) % 100);
            default:
                return [];
        }
    }

    // Xử lý mode 'posX' (trả về số tại vị trí X trong danh sách giải)
    if (mode.startsWith('pos')) {
        const pos = parseInt(mode.replace('pos', '')); // posX là vị trí từ 0 đến 26
        const allNumbers = [
            day.special,        // pos0
            day.prize1,         // pos1
            day.prize2_1,       // pos2
            day.prize2_2,       // pos3
            day.prize3_1,       // pos4
            day.prize3_2,       // pos5
            day.prize3_3,       // pos6
            day.prize3_4,       // pos7
            day.prize3_5,       // pos8
            day.prize3_6,       // pos9
            day.prize4_1,       // pos10
            day.prize4_2,       // pos11
            day.prize4_3,       // pos12
            day.prize4_4,       // pos13
            day.prize5_1,       // pos14
            day.prize5_2,       // pos15
            day.prize5_3,       // pos16
            day.prize5_4,       // pos17
            day.prize5_5,       // pos18
            day.prize5_6,       // pos19
            day.prize6_1,       // pos20
            day.prize6_2,       // pos21
            day.prize6_3,       // pos22
            day.prize7_1,       // pos23
            day.prize7_2,       // pos24
            day.prize7_3,       // pos25
            day.prize7_4        // pos26
        ].filter(num => num !== undefined && num !== null)
         .map(num => Number(num) % 100);
        if (pos >= 0 && pos < allNumbers.length) {
            return [allNumbers[pos]];
        }
        return [];
    }

    return [];
};
/**
 * Hàm thống kê chuỗi tổng liên tiếp với nhiều tiêu chí
 * @param {Array} data - Dữ liệu xổ số
 * @param {string} startDate - Ngày bắt đầu
 * @param {string} endDate - Ngày kết thúc
 * @param {string} mode - Chế độ lấy số ('de', 'lo', 'prize1', v.v.)
 * @param {number} consecutiveDays - Số ngày liên tiếp
 * @param {string} sumType - Kiểu tính tổng ('traditional' hoặc 'new')
 * @param {string} sequenceType - Loại chuỗi ('even', 'odd')
 * @param {string} pattern - Kiểu mẫu ('ascending', 'descending', 'consecutive')
 * @returns {Object} Kết quả thống kê
 */
const findEvenOddSumSequences = (data, startDate, endDate, mode, consecutiveDays, sumType, sequenceType, pattern) => {
    // Import các hàm cần thiết từ lotteryService
    
    try {
        // --- PHẦN KIỂM TRA ĐẦU VÀO VÀ HÀM HỖ TRỢ (Giữ nguyên từ code của bạn) ---
        if (!Array.isArray(data)) {
            console.error('Invalid data: data is not an array');
            return { results: [], total: 0, message: 'Dữ liệu không hợp lệ.' };
        }

        const parity = sequenceType === 'even' ? 'even' : 'odd';
        const direction = (pattern === 'ascending' || pattern === 'consecutive') ? 'ascending' : 'descending';
        
        if (!['traditional', 'new'].includes(sumType)) {
            return { results: [], total: 0, message: 'Kiểu tính tổng không hợp lệ.' };
        }

        if (consecutiveDays < 2 || consecutiveDays > 20) {
            consecutiveDays = Math.max(2, Math.min(consecutiveDays, 20));
        }

        const filteredData = data
            .filter(item => {
                if (!item || !item.date) return false;
                const itemDate = new Date(item.date);
                return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (filteredData.length < consecutiveDays) {
            return { results: [], total: 0, message: 'Không đủ dữ liệu cho số ngày liên tiếp yêu cầu.' };
        }

        const calculateSum = (num) => {
            if (num === null || num === undefined || isNaN(num)) return null;
            num = Number(num) % 100;
            const head = Math.floor(num / 10);
            const tail = num % 10;
            const rawSum = head + tail;
            if (sumType === 'traditional') {
                if (num === 0) return 10;
                return rawSum % 10 === 0 ? 10 : rawSum % 10;
            } else {
                return rawSum;
            }
        };

        const isValidParity = (sum) => (parity === 'even' ? sum % 2 === 0 : sum % 2 === 1);
        const results = [];

        // --- BẮT ĐẦU LOGIC MỚI ĐÃ SỬA LỖI ---
        for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
            const days = filteredData.slice(i, i + consecutiveDays);

            const sumsAndNumbersPerDay = days.map(day => {
                const map = new Map();
                const numbers = getNumbersByMode(day, mode);
                for (const num of numbers) {
                    const sum = calculateSum(num);
                    if (isValidParity(sum)) {
                        if (!map.has(sum)) map.set(sum, []);
                        map.get(sum).push(num);
                    }
                }
                return map;
            });

            if (sumsAndNumbersPerDay.some(map => map.size === 0)) {
                continue;
            }

            const findSequences = (dayIndex, currentSums, currentNumbers) => {
                if (currentSums.length === consecutiveDays) {
                    // Lấy tất cả các số khớp cho mỗi ngày
                    const matchedNumbersPerDay = currentNumbers.map((num, idx) => sumsAndNumbersPerDay[idx].get(currentSums[idx]));

                    results.push({
                        sum: currentSums,
                        numbers: matchedNumbersPerDay,
                        sumType: sumType,
                        results: days.map((day, idx) => ({
                            date: day.date,
                            numbers: getNumbersByMode(day, mode),
                            matched: [currentNumbers[idx]],
                            sum: currentSums[idx]
                        })),
                        dates: days.map(day => day.date)
                    });
                    return;
                }

                const lastSum = currentSums.length > 0 ? currentSums[currentSums.length - 1] : (direction === 'ascending' ? -1 : 19);
                const currentDayMap = sumsAndNumbersPerDay[dayIndex];
                const sortedSums = [...currentDayMap.keys()].sort((a, b) => a - b);

                for (const sum of sortedSums) {
                    const condition = direction === 'ascending' ? sum > lastSum : sum < lastSum;
                    if (condition) {
                        const matchingNumber = currentDayMap.get(sum)[0];
                        findSequences(dayIndex + 1, [...currentSums, sum], [...currentNumbers, matchingNumber]);
                    }
                }
            };

            findSequences(0, [], []);
        }

        // --- PHẦN TRẢ VỀ KẾT QUẢ (Giữ nguyên từ code của bạn) ---
        const limitedResults = results.slice(0, 200);
        const total = results.length;
        let message = '';
        if (total === 0) {
            message = 'Không tìm thấy chuỗi phù hợp';
        } else {
            let patternDesc = (parity === 'even' ? 'tổng chẵn ' : 'tổng lẻ ');
            patternDesc += direction === 'ascending' ? 'tăng dần' : 'giảm dần';
            const sumTypeDesc = sumType === 'traditional' ? '(kiểu truyền thống)' : '(kiểu mới)';
            message = `Tìm thấy ${total} chuỗi ${patternDesc} ${sumTypeDesc}`;
            if (total > 200) {
                message += `. Chỉ hiển thị 200 kết quả đầu tiên`;
            }
        }
        return { results: limitedResults, total, message };
    } catch (error) {
        console.error('Lỗi trong findEvenOddSumSequences:', error);
        return { results: [], total: 0, message: 'Lỗi khi xử lý dữ liệu: ' + error.message };
    }
};

/**
 * Hàm tính tổng số theo kiểu truyền thống hoặc mới
 * @param {number} number - Số cần tính tổng (0-99)
 * @param {string} sumType - Kiểu tính tổng ('traditional' hoặc 'new')
 * @returns {number} - Tổng các chữ số
 */
const calculateSum = (number, sumType = 'traditional') => {
    // Đảm bảo number là số nguyên từ 0-99
    const num = parseInt(String(number).replace(/\D/g, ''), 10) % 100;
    const tens = Math.floor(num / 10);
    const units = num % 10;
    const rawSum = tens + units;

    if (sumType === 'new') {
        return rawSum; // Kiểu mới: tổng nguyên bản (0-18)
    } else {
        // Kiểu truyền thống: lấy phần đơn vị, trường hợp đặc biệt số 0
        if (num === 0) {
            return 10;
        }
        return rawSum % 10 === 0 ? 10 : rawSum % 10;
    }
};

/**
 * Tìm tất cả các chuỗi tổng theo dạng sole (lặp lại) theo số ngày liên tiếp
 * @param {Array} data - Dữ liệu xổ số
 * @param {string} startDate - Ngày bắt đầu tìm kiếm
 * @param {string} endDate - Ngày kết thúc tìm kiếm
 * @param {string} mode - Chế độ tìm kiếm (de, lo, prize1, ...)
 * @param {number} consecutiveDays - Số ngày liên tiếp tối thiểu (từ 3 trở lên)
 * @param {string} sumType - Kiểu tính tổng ('traditional' hoặc 'new')
 * @returns {Object} - Kết quả tìm kiếm
 */
const findSoleSumSequences = (data, startDate, endDate, mode, consecutiveDays = 3, sumType = 'traditional') => {
    if (!Array.isArray(data)) {
        console.error("Dữ liệu đầu vào không phải là mảng");
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }
    
    // Đảm bảo số ngày liên tiếp tối thiểu là 3 để tìm được mẫu sole
    if (consecutiveDays < 3) consecutiveDays = 3;
    if (consecutiveDays > 20) consecutiveDays = 20;
    
    // Lọc dữ liệu trong khoảng thời gian
    const filteredData = data
        .filter(entry => {
            if (!entry || !entry.date) return false;
            try {
                const entryDate = new Date(entry.date);
                return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
            } catch (e) {
                console.error("Lỗi khi xử lý ngày:", e);
                return false;
            }
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (filteredData.length < consecutiveDays) {
        console.warn(`Không đủ dữ liệu: ${filteredData.length} ngày, cần ${consecutiveDays} ngày`);
        return { 
            results: [], 
            total: 0, 
            message: `Không đủ dữ liệu cho ${consecutiveDays} ngày liên tiếp.` 
        };
    }
    
    //console.log(`Tìm kiếm trên ${filteredData.length} ngày dữ liệu`);
    
    const results = [];
    
    // Duyệt qua từng chuỗi ngày liên tiếp
    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => {
            try {
                return getNumbersByMode(day, mode);
            } catch (e) {
                console.error(`Lỗi khi lấy số cho ngày ${day.date}:`, e);
                return [];
            }
        });
        
        // Nếu có ngày không có số, bỏ qua
        if (numbersPerDay.some(dayNumbers => dayNumbers.length === 0)) {
            continue;
        }

        // Tạo bảng tra cứu số => tổng cho mỗi ngày
        const daysSumsMap = numbersPerDay.map(dayNumbers => {
            const sumMap = {};
            dayNumbers.forEach(num => {
                const numStr = String(num);
                const sum = calculateSum(numStr, sumType);
                if (!sumMap[sum]) sumMap[sum] = [];
                sumMap[sum].push(num);
            });
            return sumMap;
        });
        
        // Tìm các mẫu AB - 2 tổng lặp lại
        const findABPatterns = () => {
            // Lấy tất cả các tổng có thể từ ngày đầu tiên
            const firstDaySums = Object.keys(daysSumsMap[0]).map(Number);
            
            for (const sumA of firstDaySums) {
                // Tìm tất cả các tổng trong ngày thứ 2 khác với tổng của ngày đầu tiên
                const secondDaySums = Object.keys(daysSumsMap[1])
                    .map(Number)
                    .filter(sum => sum !== sumA);
                
                for (const sumB of secondDaySums) {
                    let isValidPattern = true;
                    const matchedNumbers = [];
                    
                    // Kiểm tra mẫu AB có lặp lại trong chuỗi này không
                    for (let j = 0; j < consecutiveDays; j++) {
                        const expectedSum = j % 2 === 0 ? sumA : sumB;
                        if (!daysSumsMap[j][expectedSum]) {
                            isValidPattern = false;
                            break;
                        }
                        matchedNumbers.push(daysSumsMap[j][expectedSum]);
                    }
                    
                    if (isValidPattern) {
                        results.push({
                            pattern: [sumA, sumB],
                            soleType: "AB",
                            dates: days.map(day => day.date),
                            numbers: matchedNumbers,
                            sumType: sumType,
                            results: days.map((day, idx) => ({
                                date: day.date,
                                numbers: getNumbersByMode(day, mode),
                                sum: idx % 2 === 0 ? sumA : sumB
                            }))
                        });
                    }
                }
            }
        };
        
        // Tìm các mẫu ABC - 3 tổng lặp lại
        const findABCPatterns = () => {
            // Chỉ tìm mẫu ABC khi có đủ số ngày
            if (consecutiveDays < 6) return;
            
            // Lấy tất cả tổng có thể từ 3 ngày đầu
            const firstDaySums = Object.keys(daysSumsMap[0]).map(Number);
            
            for (const sumA of firstDaySums) {
                const secondDaySums = Object.keys(daysSumsMap[1]).map(Number);
                
                for (const sumB of secondDaySums) {
                    if (sumA === sumB) continue; // Cần ít nhất 2 tổng khác nhau
                    
                    const thirdDaySums = Object.keys(daysSumsMap[2]).map(Number);
                    
                    for (const sumC of thirdDaySums) {
                        // Bỏ qua nếu 3 tổng giống nhau
                        if (sumA === sumB && sumB === sumC) continue;
                        
                        let isValidPattern = true;
                        const matchedNumbers = [];
                        
                        // Kiểm tra mẫu ABC có lặp lại trong chuỗi này không
                        for (let j = 0; j < consecutiveDays; j++) {
                            const expectedSum = j % 3 === 0 ? sumA : (j % 3 === 1 ? sumB : sumC);
                            if (!daysSumsMap[j][expectedSum]) {
                                isValidPattern = false;
                                break;
                            }
                            matchedNumbers.push(daysSumsMap[j][expectedSum]);
                        }
                        
                        if (isValidPattern) {
                            results.push({
                                pattern: [sumA, sumB, sumC],
                                soleType: "ABC",
                                dates: days.map(day => day.date),
                                numbers: matchedNumbers,
                                sumType: sumType,
                                results: days.map((day, idx) => ({
                                    date: day.date,
                                    numbers: getNumbersByMode(day, mode),
                                    sum: idx % 3 === 0 ? sumA : (idx % 3 === 1 ? sumB : sumC)
                                }))
                            });
                        }
                    }
                }
            }
        };
        
        // Tìm kiếm cả hai loại mẫu
        findABPatterns();
        findABCPatterns();
    }
    
   // console.log(`Tổng số kết quả tìm thấy: ${results.length}`);
    
    // Loại bỏ kết quả trùng lặp
    const uniqueResults = [];
    const patternSet = new Set();
    
    results.forEach(result => {
        const patternKey = `${result.soleType}_${result.pattern.join('-')}_${result.dates[0]}`;
        if (!patternSet.has(patternKey)) {
            patternSet.add(patternKey);
            uniqueResults.push(result);
        }
    });
    
    //console.log(`Số kết quả sau khi loại bỏ trùng lặp: ${uniqueResults.length}`);
    
    const limitedResults = uniqueResults.slice(0, 200);
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" 
                  : uniqueResults.length === 0 ? "Không tìm thấy chuỗi tổng sole" : "";
    
    return { results: limitedResults, total, message };
};

/**
 * Hàm kiểm tra một chuỗi số có phải là chuỗi số học (tăng/giảm dần đều) không.
 */
function isArithmetic(sequence) {
    if (sequence.length <= 1) return true;
    const diff = sequence[1] - sequence[0];
    if (diff === 0) return false; // Không tính chuỗi có các phần tử bằng nhau
    for (let i = 2; i < sequence.length; i++) {
        if (sequence[i] - sequence[i - 1] !== diff) {
            return false;
        }
    }
    return true;
}

/**
 * [HÀM MỚI] Tìm các chuỗi nâng cao dựa trên nhiều tiêu chí phức hợp.
 */
// File: utils/lotteryAnalyzerSumSequences.js

const findAdvancedSumSequences = (data, options) => {
    // Dòng require này đã được xóa ở các bước trước để file độc lập
    // const { getNumbersByMode } = require('../services/lotteryService');

    const {
        startDate, endDate, mode, consecutiveDays,
        analysisType, pattern, sumType, sumParity, numberParity
    } = options;

    // --- CÁC HÀM HỖ TRỢ ---
    const calculateSum = (num, currentSumType) => {
        if (num === null || num === undefined || isNaN(num)) return null;
        num = Number(num) % 100;
        const head = Math.floor(num / 10);
        const tail = num % 10;
        const rawSum = head + tail;
        return currentSumType === 'traditional' ? (num === 0 ? 10 : (rawSum % 10 === 0 ? 10 : rawSum % 10)) : rawSum;
    };

    // [SỬA LỖI TẠI ĐÂY] - Hàm này giờ sẽ xử lý tổng từ 0-18
    const getSumParityPattern = (sum) => {
        if (sum < 0 || sum > 18) return null;
        const head = Math.floor(sum / 10); // Sẽ là 0 cho các tổng < 10
        const tail = sum % 10;
        const headParity = head % 2 === 0 ? 'even' : 'odd';
        const tailParity = tail % 2 === 0 ? 'even' : 'odd';
        return `${headParity}-${tailParity}`;
    };

    function isArithmetic(sequence) {
        if (sequence.length <= 1) return true;
        const diff = sequence[1] - sequence[0];
        if (diff === 0 || Math.abs(diff) !== 2) return false;
        for (let i = 2; i < sequence.length; i++) {
            if (sequence[i] - sequence[i - 1] !== diff) return false;
        }
        return true;
    }

    // --- LOGIC CHÍNH (Giữ nguyên) ---
    const results = [];
    const direction = pattern.includes('increasing') ? 'ascending' : (pattern.includes('decreasing') ? 'descending' : null);

    const filteredData = data.filter(item => new Date(item.date) >= new Date(startDate) && new Date(item.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredData.length < consecutiveDays) {
        return { results: [], total: 0, message: 'Không đủ dữ liệu.' };
    }

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        
        const dayDetailsPerDay = days.map(day => {
            const map = new Map();
            const numbers = getNumbersByMode(day, mode);
            for (const num of numbers) {
                let value;
                let isValid = false;

                if (analysisType === 'sum') {
                    value = calculateSum(num, sumType);
                    isValid = (sumParity === 'even' ? value % 2 === 0 : value % 2 === 1);
                } else if (analysisType === 'sum_parity_pattern') {
                    const sum = calculateSum(num, 'new'); // Luôn dùng tổng kiểu mới
                    const sumPattern = getSumParityPattern(sum);
                    if (sumPattern === numberParity) {
                        value = sum;
                        isValid = true;
                    }
                }

                if (isValid) {
                    if (!map.has(value)) map.set(value, []);
                    map.get(value).push(num);
                }
            }
            return map;
        });
        
        const validValuesPerDay = dayDetailsPerDay.map(map => [...map.keys()]);
        if (validValuesPerDay.some(values => values.length === 0)) continue;
        
        const findSequencesRecursive = (dayIndex, currentSequence) => {
            if (currentSequence.length === consecutiveDays) {
                if (pattern.includes('arithmetic') && !isArithmetic(currentSequence)) {
                    return;
                }
                
                results.push({
                    sequence: currentSequence,
                    dates: days.map(d => d.date),
                    results: days.map((day, idx) => ({
                        date: day.date,
                        numbers: getNumbersByMode(day, mode),
                        matched: dayDetailsPerDay[idx].get(currentSequence[idx]) || []
                    }))
                });
                return;
            }

            const lastValue = currentSequence.length > 0 ? currentSequence[currentSequence.length - 1] : (direction === 'ascending' ? -Infinity : Infinity);
            for (const value of validValuesPerDay[dayIndex]) {
                const condition = direction === 'ascending' ? value > lastValue : value < lastValue;
                if (condition) {
                    findSequencesRecursive(dayIndex + 1, [...currentSequence, value]);
                }
            }
        };

        if (pattern === 'consecutive_occurrence') {
             results.push({
                sequence: validValuesPerDay.map(v => v[0]),
                dates: days.map(d => d.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode),
                    matched: dayDetailsPerDay[idx].get(validValuesPerDay[idx][0]) || []
                }))
            });
        } else {
            findSequencesRecursive(0, []);
        }
    }
    
    const total = results.length;
    return {
        results: results.slice(0, 200),
        total,
        message: total > 200 ? "Chỉ hiển thị 200 kết quả đầu tiên." : ""
    };
};

module.exports = {
    findSoleSumSequences,
    findEvenOddSumSequences,
    findAdvancedSumSequences // Hàm mới
};