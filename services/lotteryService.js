// Hàm phụ trợ để lấy tất cả các số từ một ngày theo mode
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

// Hàm định dạng ngày
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Lấy ngày hiện tại
const getCurrentDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Lấy ngày mặc định (360 ngày trước)
const getDefaultStartDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 360);
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const isValidDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return false;
    const date = new Date(dateString);
    const isValid = !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!isValid) return false;
    // Ensure the parsed date matches the input (handles cases like '2025-04-31')
    const [year, month, day] = dateString.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
};

// Tìm các số xuất hiện liên tiếp
const findConsecutivePairs = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    const filteredData = data
        .filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const firstDayNumbers = numbersPerDay[0];
        
        for (const num of firstDayNumbers) {
            const appearsConsecutively = numbersPerDay.every(dayNumbers => dayNumbers.includes(num));
            if (appearsConsecutively) {
                results.push({
                    number: num, // Giữ lại để tương thích
                    sequence: Array(consecutiveDays).fill(num), // [THÊM MỚI]
                    dates: days.map(day => day.date),
                    results: days.map((day, idx) => ({
                        date: day.date,
                        numbers: getNumbersByMode(day, mode),
                        extracted: [num] // [THÊM MỚI]
                    }))
                });
            }
        }
    }
    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};

const findConsecutiveNumbers = (data, startDate, endDate, type, mode, consecutiveDays = 3) => {
    const results = [];
    const filteredData = data.filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const extractFunc = type === 'head' ? (num) => Math.floor(num / 10) : (num) => num % 10;

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const valuesPerDay = numbersPerDay.map(numbers => numbers.map(extractFunc));
        const uniqueValues = [...new Set(valuesPerDay.flat())];

        for (const value of uniqueValues) {
            if (valuesPerDay.every(dayValues => dayValues.includes(value))) {
                results.push({
                    number: value, // Giữ lại để tương thích
                    sequence: Array(consecutiveDays).fill(value), // [THÊM MỚI]
                    dates: days.map(day => day.date),
                    results: days.map((day, idx) => {
                        const allNumbers = getNumbersByMode(day, mode);
                        return {
                            date: day.date,
                            numbers: allNumbers,
                            extracted: allNumbers.filter(n => extractFunc(n) === value) // [THÊM MỚI]
                        }
                    })
                });
            }
        }
    }
    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};

const findAlternatingNumberPairs = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    const filteredData = data.filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate));

    if (filteredData.length < consecutiveDays) return { results, total: 0, message: `Không đủ dữ liệu` };

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const firstDayNumbers = numbersPerDay[0];
        const secondDayNumbers = numbersPerDay[1];

        for (const numA of firstDayNumbers) {
            for (const numB of secondDayNumbers) {
                if (numA === numB) continue;
                let isPatternMatch = true;
                const sequence = [];
                for (let k = 0; k < consecutiveDays; k++) {
                    const targetNum = (k % 2 === 0) ? numA : numB;
                    sequence.push(targetNum);
                    if (!numbersPerDay[k].includes(targetNum)) {
                        isPatternMatch = false;
                        break;
                    }
                }
                if (isPatternMatch) {
                    results.push({
                        numbers: [numA, numB], // Giữ lại để tương thích
                        sequence: sequence, // [THÊM MỚI]
                        dates: days.map(day => day.date),
                        results: days.map((day, idx) => ({
                            date: day.date,
                            numbers: getNumbersByMode(day, mode),
                            extracted: [sequence[idx]] // [THÊM MỚI]
                        }))
                    });
                }
            }
        }
    }
    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};

const findAlternatingNumbers = (data, startDate, endDate, type, mode, consecutiveDays = 3) => {
    const results = [];
    const filteredData = data.filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredData.length < consecutiveDays) return { results, total: 0, message: `Không đủ dữ liệu` };

    const extractFunc = type === 'head' ? (num) => Math.floor(num / 10) : (num) => num % 10;

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const firstDayValues = [...new Set(numbersPerDay[0].map(extractFunc))];
        const secondDayValues = [...new Set(numbersPerDay[1].map(extractFunc))];

        for (const valA of firstDayValues) {
            for (const valB of secondDayValues) {
                if (valA === valB) continue;
                let isPatternMatch = true;
                const detailedResults = [];
                const sequence = [];
                for (let k = 0; k < consecutiveDays; k++) {
                    const expectedValue = (k % 2 === 0) ? valA : valB;
                    sequence.push(expectedValue);
                    const matchingNumbers = numbersPerDay[k].filter(num => extractFunc(num) === expectedValue);
                    if (matchingNumbers.length === 0) {
                        isPatternMatch = false;
                        break;
                    }
                    detailedResults.push({
                        date: days[k].date,
                        numbers: numbersPerDay[k],
                        extracted: matchingNumbers
                    });
                }
                if (isPatternMatch) {
                    results.push({
                        numbers: [valA, valB], // Giữ lại để tương thích
                        sequence: sequence, // [THÊM MỚI]
                        type: type,
                        dates: days.map(day => day.date),
                        results: detailedResults
                    });
                }
            }
        }
    }
    
    const uniqueResults = [...new Map(results.map(res => [res.dates.join(',') + '-' + res.numbers.sort().join(','), res])).values()];
    const limitedResults = uniqueResults.slice(0, 200);
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};

const findParityHeadTailSequences = (data, startDate, endDate, mode, consecutiveDays, type, parity, pattern) => {
    const results = [];
    if (!data) return { results, total: 0, message: 'Dữ liệu không hợp lệ.' };

    const direction = pattern.includes('increasing') ? 'ascending' : (pattern.includes('decreasing') ? 'descending' : null);
    const extractFunc = type === 'head' ? (num) => Math.floor(num / 10) : (num) => num % 10;
    const isParityMatch = (val) => (parity === 'even' ? val % 2 === 0 : val % 2 === 1);

    const isArithmetic = (sequence) => {
        if (sequence.length <= 1) return true;
        const diff = sequence[1] - sequence[0];
        if (Math.abs(diff) !== 2) return false;
        for (let i = 2; i < sequence.length; i++) {
            if (sequence[i] - sequence[i - 1] !== diff) return false;
        }
        return true;
    };

    const filteredData = data
        .filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredData.length < consecutiveDays) return { results, total: 0, message: 'Không đủ dữ liệu.' };

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const dayDetails = days.map(day => {
            const numbers = getNumbersByMode(day, mode);
            const values = [...new Set(numbers.map(extractFunc).filter(isParityMatch))].sort((a, b) => a - b);
            return { numbers, values };
        });

        if (dayDetails.some(detail => detail.values.length === 0)) continue;

        const createResultObject = (sequence) => ({
            numbers: sequence,
            dates: days.map(d => d.date),
            results: days.map((day, idx) => {
                const matchedValue = sequence[idx];
                const originalNumbers = dayDetails[idx].numbers;
                const extractedNumbers = originalNumbers.filter(n => extractFunc(n) === matchedValue);
                return { date: day.date, numbers: originalNumbers, extracted: extractedNumbers };
            })
        });

        if (pattern === 'consecutive_occurrence') {
            const sequence = dayDetails.map(detail => detail.values[0]);
            results.push(createResultObject(sequence));
            continue;
        }

        let sequences = dayDetails[0].values.map(val => [val]);
        for (let dayIndex = 1; dayIndex < consecutiveDays; dayIndex++) {
            const newSequences = [];
            for (const seq of sequences) {
                const lastValue = seq[seq.length - 1];
                for (const nextValue of dayDetails[dayIndex].values) {
                    let condition = false;
                    if (pattern === 'monotonic_increasing') condition = nextValue > lastValue;
                    else if (pattern === 'monotonic_decreasing') condition = nextValue < lastValue;
                    else if (pattern === 'arithmetic_increasing') condition = nextValue === lastValue + 2;
                    else if (pattern === 'arithmetic_decreasing') condition = nextValue === lastValue - 2;

                    if (condition) {
                        newSequences.push([...seq, nextValue]);
                    }
                }
            }
            sequences = newSequences;
        }
        sequences.forEach(seq => {
            if (seq.length === consecutiveDays) {
                results.push(createResultObject(seq));
            }
        });
    }

    const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item.numbers) + JSON.stringify(item.dates), item])).values()];
    const limitedResults = uniqueResults.slice(0, 200);
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};

// [THAY THẾ HÀM CŨ]
const findConsecutiveDoubleNumbers = (data, startDate, endDate, mode, consecutiveDays, pattern) => {
    // Hàm kiểm tra một số có phải là số kép không
    const isDoubleNumber = (num) => num % 11 === 0;
    
    // Gọi hàm thống kê chung
    return findSpecialNumberSequences(data, startDate, endDate, mode, consecutiveDays, pattern, isDoubleNumber);
};

// [THAY THẾ HÀM CŨ]
const findConsecutiveOffsetDoubleNumbers = (data, startDate, endDate, mode, consecutiveDays, pattern) => {
    // Hàm kiểm tra một số có phải là số kép lệch không
    const isOffsetDoubleNumber = (num) => {
        const head = Math.floor(num / 10);
        const tail = num % 10;
        return Math.abs(head - tail) === 5;
    };
    
    // Gọi hàm thống kê chung
    return findSpecialNumberSequences(data, startDate, endDate, mode, consecutiveDays, pattern, isOffsetDoubleNumber);
};

const findSpecialNumberSequences = (data, startDate, endDate, mode, consecutiveDays, pattern, numberCheckFunc) => {
    const results = [];
    if (!Array.isArray(data)) return { results: [], total: 0, message: "Dữ liệu không hợp lệ" };
    
    const filteredData = data
        .filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredData.length < consecutiveDays) return { results: [], total: 0, message: 'Không đủ dữ liệu.' };

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => 
            [...new Set(getNumbersByMode(day, mode).filter(numberCheckFunc))].sort((a, b) => a - b)
        );

        // Bỏ qua nếu có bất kỳ ngày nào không có số hợp lệ
        if (numbersPerDay.some(numbers => numbers.length === 0)) continue;

        // [SỬA ĐỔI LOGIC TẠI ĐÂY]
        if (pattern === 'consecutive_occurrence') {
            // Logic mới: Chỉ cần mỗi ngày có ít nhất một số cùng dạng là đủ.
            // Chuỗi hiển thị sẽ là chuỗi đại diện (lấy số đầu tiên của mỗi ngày).
            const representativeSequence = numbersPerDay.map(dayNumbers => dayNumbers[0]);
            
            const resultObject = {
                sequence: representativeSequence,
                dates: days.map(d => d.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode),
                    extracted: numbersPerDay[idx] // Hiển thị tất cả các số hợp lệ trong ngày đó
                }))
            };
            results.push(resultObject);

        } else {
            // Logic cũ cho các dạng tăng/giảm/dần đều (tìm một chuỗi cụ thể) được giữ nguyên
            let sequences = numbersPerDay[0].map(val => [val]);
            for (let dayIndex = 1; dayIndex < consecutiveDays; dayIndex++) {
                const newSequences = [];
                for (const seq of sequences) {
                    const lastValue = seq[seq.length - 1];
                    for (const nextValue of numbersPerDay[dayIndex]) {
                        let condition = false;
                        if (pattern === 'monotonic_increasing') condition = nextValue > lastValue;
                        else if (pattern === 'monotonic_decreasing') condition = nextValue < lastValue;
                        else if (pattern === 'arithmetic_increasing') condition = nextValue === lastValue + 1;
                        else if (pattern === 'arithmetic_decreasing') condition = nextValue === lastValue - 1;
                        
                        if (condition) newSequences.push([...seq, nextValue]);
                    }
                }
                sequences = newSequences;
            }
            sequences.forEach(seq => {
                 const resultObject = {
                    sequence: seq,
                    dates: days.map(d => d.date),
                    results: days.map((day, idx) => ({
                        date: day.date,
                        numbers: getNumbersByMode(day, mode),
                        extracted: [seq[idx]] // Chỉ hiển thị số nằm trong chuỗi cụ thể tìm được
                    }))
                };
                results.push(resultObject);
            });
        }
    }

    const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item.sequence) + JSON.stringify(item.dates), item])).values()];
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: uniqueResults.slice(0, 200), total, message };
};



// Tìm đầu chẵn > 4 liên tiếp
const findEvenHeadsGreaterThan4 = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));

        const hasEvenHeadGreaterThan4EachDay = numbersPerDay.every(dayNumbers => 
            dayNumbers.some(num => {
                const head = Math.floor(num / 10);
                return head % 2 === 0 && head > 4;
            })
        );

        if (hasEvenHeadGreaterThan4EachDay) {
            const allEvenHeadsGreaterThan4 = [...new Set(numbersPerDay.flat().filter(num => {
                const head = Math.floor(num / 10);
                return head % 2 === 0 && head > 4;
            }))];
            results.push({
                numbers: allEvenHeadsGreaterThan4,
                dates: days.map(day => day.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode)
                }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

// Tìm đầu chẵn < 4 liên tiếp
const findEvenHeadsLessThan4 = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));

        const hasEvenHeadLessThan4EachDay = numbersPerDay.every(dayNumbers => 
            dayNumbers.some(num => {
                const head = Math.floor(num / 10);
                return head % 2 === 0 && head < 4;
            })
        );

        if (hasEvenHeadLessThan4EachDay) {
            const allEvenHeadsLessThan4 = [...new Set(numbersPerDay.flat().filter(num => {
                const head = Math.floor(num / 10);
                return head % 2 === 0 && head < 4;
            }))];
            results.push({
                numbers: allEvenHeadsLessThan4,
                dates: days.map(day => day.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode)
                }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

// Tìm đít chẵn > 4 liên tiếp
const findEvenTailsGreaterThan4 = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));

        const hasEvenTailGreaterThan4EachDay = numbersPerDay.every(dayNumbers => 
            dayNumbers.some(num => {
                const tail = num % 10;
                return tail % 2 === 0 && tail > 4;
            })
        );

        if (hasEvenTailGreaterThan4EachDay) {
            const allEvenTailsGreaterThan4 = [...new Set(numbersPerDay.flat().filter(num => {
                const tail = num % 10;
                return tail % 2 === 0 && tail > 4;
            }))];
            results.push({
                numbers: allEvenTailsGreaterThan4,
                dates: days.map(day => day.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode)
                }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

// Tìm đít chẵn < 4 liên tiếp
const findEvenTailsLessThan4 = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));

        const hasEvenTailLessThan4EachDay = numbersPerDay.every(dayNumbers => 
            dayNumbers.some(num => {
                const tail = num % 10;
                return tail % 2 === 0 && tail < 4;
            })
        );

        if (hasEvenTailLessThan4EachDay) {
            const allEvenTailsLessThan4 = [...new Set(numbersPerDay.flat().filter(num => {
                const tail = num % 10;
                return tail % 2 === 0 && tail < 4;
            }))];
            results.push({
                numbers: allEvenTailsLessThan4,
                dates: days.map(day => day.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode)
                }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

// Tìm đầu lẻ > 5 liên tiếp
const findOddHeadsGreaterThan5 = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));

        const hasOddHeadGreaterThan5EachDay = numbersPerDay.every(dayNumbers => 
            dayNumbers.some(num => {
                const head = Math.floor(num / 10);
                return head % 2 === 1 && head > 5;
            })
        );

        if (hasOddHeadGreaterThan5EachDay) {
            const allOddHeadsGreaterThan5 = [...new Set(numbersPerDay.flat().filter(num => {
                const head = Math.floor(num / 10);
                return head % 2 === 1 && head > 5;
            }))];
            results.push({
                numbers: allOddHeadsGreaterThan5,
                dates: days.map(day => day.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode)
                }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

// Tìm đầu lẻ < 5 liên tiếp
const findOddHeadsLessThan5 = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));

        const hasOddHeadLessThan5EachDay = numbersPerDay.every(dayNumbers => 
            dayNumbers.some(num => {
                const head = Math.floor(num / 10);
                return head % 2 === 1 && head < 5;
            })
        );

        if (hasOddHeadLessThan5EachDay) {
            const allOddHeadsLessThan5 = [...new Set(numbersPerDay.flat().filter(num => {
                const head = Math.floor(num / 10);
                return head % 2 === 1 && head < 5;
            }))];
            results.push({
                numbers: allOddHeadsLessThan5,
                dates: days.map(day => day.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode)
                }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

// Tìm đít lẻ > 5 liên tiếp
const findOddTailsGreaterThan5 = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));

        const hasOddTailGreaterThan5EachDay = numbersPerDay.every(dayNumbers => 
            dayNumbers.some(num => {
                const tail = num % 10;
                return tail % 2 === 1 && tail > 5;
            })
        );

        if (hasOddTailGreaterThan5EachDay) {
            const allOddTailsGreaterThan5 = [...new Set(numbersPerDay.flat().filter(num => {
                const tail = num % 10;
                return tail % 2 === 1 && tail > 5;
            }))];
            results.push({
                numbers: allOddTailsGreaterThan5,
                dates: days.map(day => day.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode)
                }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

// Tìm đít lẻ < 5 liên tiếp
const findOddTailsLessThan5 = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));

        const hasOddTailLessThan5EachDay = numbersPerDay.every(dayNumbers => 
            dayNumbers.some(num => {
                const tail = num % 10;
                return tail % 2 === 1 && tail < 5;
            })
        );

        if (hasOddTailLessThan5EachDay) {
            const allOddTailsLessThan5 = [...new Set(numbersPerDay.flat().filter(num => {
                const tail = num % 10;
                return tail % 2 === 1 && tail < 5;
            }))];
            results.push({
                numbers: allOddTailsLessThan5,
                dates: days.map(day => day.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode)
                }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

// Tìm số lượng đầu/đít xuất hiện liên tiếp
const findHeadAndTailStats = (data, startDate, endDate, mode, n, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data) || !n) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào hoặc tham số n không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const checkCondition = (head, tail, n) => {
        if (n === "0101") return head % 2 === 0 && head > 4 && tail % 2 === 0 && tail > 4;
        else if (n === "0100") return head % 2 === 0 && head > 4 && tail % 2 === 0 && tail < 4;
        else if (n === "0111") return head % 2 === 0 && head > 4 && tail % 2 === 1 && tail > 5;
        else if (n === "0110") return head % 2 === 0 && head > 4 && tail % 2 === 1 && tail < 5;
        else if (n === "0001") return head % 2 === 0 && head < 4 && tail % 2 === 0 && tail > 4;
        else if (n === "0000") return head % 2 === 0 && head < 4 && tail % 2 === 0 && tail < 4;
        else if (n === "0011") return head % 2 === 0 && head < 4 && tail % 2 === 1 && tail > 5;
        else if (n === "0010") return head % 2 === 0 && head < 4 && tail % 2 === 1 && tail < 5;
        else if (n === "1101") return head % 2 === 1 && head > 5 && tail % 2 === 0 && tail > 4;
        else if (n === "1100") return head % 2 === 1 && head > 5 && tail % 2 === 0 && tail < 4;
        else if (n === "1111") return head % 2 === 1 && head > 5 && tail % 2 === 1 && tail > 5;
        else if (n === "1110") return head % 2 === 1 && head > 5 && tail % 2 === 1 && tail < 5;
        else if (n === "1001") return head % 2 === 1 && head < 5 && tail % 2 === 0 && tail > 4;
        else if (n === "1000") return head % 2 === 1 && head < 5 && tail % 2 === 0 && tail < 4;
        else if (n === "1011") return head % 2 === 1 && head < 5 && tail % 2 === 1 && tail > 5;
        else if (n === "1010") return head % 2 === 1 && head < 5 && tail % 2 === 1 && tail < 5;
        else if (n === "401") return head === 4 && tail % 2 === 0 && tail > 4;
        else if (n === "400") return head === 4 && tail % 2 === 0 && tail < 4;
        else if (n === "411") return head === 4 && tail % 2 === 1 && tail > 5;
        else if (n === "410") return head === 4 && tail % 2 === 1 && tail < 5;
        else if (n === "501") return head === 5 && tail % 2 === 0 && tail > 4;
        else if (n === "500") return head === 5 && tail % 2 === 0 && tail < 4;
        else if (n === "511") return head === 5 && tail % 2 === 1 && tail > 5;
        else if (n === "510") return head === 5 && tail % 2 === 1 && tail < 5;
        else if (n === "014") return tail === 4 && head % 2 === 0 && head > 4;
        else if (n === "004") return tail === 4 && head % 2 === 0 && head < 4;
        else if (n === "114") return tail === 4 && head % 2 === 1 && head > 5;
        else if (n === "104") return tail === 4 && head % 2 === 1 && head < 5;
        else if (n === "015") return tail === 5 && head % 2 === 0 && head > 4;
        else if (n === "005") return tail === 5 && head % 2 === 0 && head < 4;
        else if (n === "115") return tail === 5 && head % 2 === 1 && head > 5;
        else if (n === "105") return tail === 5 && head % 2 === 1 && head < 5;
        return false;
    };

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const validNumbersPerDay = numbersPerDay.map(numbers => numbers.filter(num => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return checkCondition(head, tail, n);
        }));

        if (validNumbersPerDay.every(dayNumbers => dayNumbers.length > 0)) {
            const allValidNumbers = [...new Set(validNumbersPerDay.flat())];
            results.push({
                numbers: allValidNumbers,
                dates: days.map(day => day.date),
                results: days.map(day => ({ date: day.date, numbers: getNumbersByMode(day, mode) }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

const findConsecutiveSum = (data, startDate, endDate, mode, consecutiveDays, sumType = 'traditional') => {
    try {
        if (!Array.isArray(data)) {
            console.error('Invalid data: data is not an array');
            return { results: [], total: 0, message: 'Dữ liệu không hợp lệ.' };
        }

        const skippedDates = [];
        const filteredData = data
            .filter(item => {
                if (!item || !item.date) {
                    console.warn('Invalid item: missing date', item);
                    return false;
                }
                const itemDate = new Date(item.date);
                return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (filteredData.length < consecutiveDays) {
            return { results: [], total: 0, message: 'Không đủ dữ liệu cho số ngày liên tiếp yêu cầu.' };
        }

        const results = [];
        const sums = sumType === 'traditional' 
            ? Array.from({ length: 10 }, (_, i) => i + 1) 
            : Array.from({ length: 19 }, (_, i) => i);

        for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
            const sequence = filteredData.slice(i, i + consecutiveDays);
            const sequenceDates = sequence.map(item => item.date);

            for (const sum of sums) {
                let allMatch = true;
                const matchingNumbersPerDay = [];

                for (const item of sequence) {
                    const numbers = getNumbersByMode(item, mode);
                    if (!numbers.length) {
                        console.warn(`No valid numbers for mode ${mode} on date ${item.date}`);
                        skippedDates.push(item.date);
                        allMatch = false;
                        break;
                    }

                    const matchingNumbers = numbers
                        .filter(num => num !== undefined && num !== null && !isNaN(num))
                        .map(num => Number(num) % 100)
                        .filter(num => calculateSum(num, sumType) === sum)
                        .map(num => String(num).padStart(2, '0'));

                    if (matchingNumbers.length === 0) {
                        allMatch = false;
                        break;
                    }
                    matchingNumbersPerDay.push(matchingNumbers);
                }

                if (allMatch) {
                    results.push({
                        sum: sum,
                        numbers: matchingNumbersPerDay,
                        dates: sequenceDates,
                        results: sequence.map((item, idx) => ({
                            date: item.date,
                            numbers: getNumbersByMode(item, mode).map(num => String(num).padStart(2, '0'))
                        }))
                    });
                }
            }
        }

        const limitedResults = results.slice(0, 200);
        const total = results.length;
        let message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : 
                     results.length === 0 ? 'Không tìm thấy tổng liên tiếp.' : '';
        if (skippedDates.length > 0) {
            message += ` Đã bỏ qua ${skippedDates.length} ngày do dữ liệu không hợp lệ: ${skippedDates.map(formatDate).join(', ')}.`;
        }
        return { results: limitedResults, total, message };
    } catch (error) {
        console.error('Error in findConsecutiveSum:', error);
        return { results: [], total: 0, message: 'Lỗi khi xử lý dữ liệu.' };
    }
};

const findSumGreaterThan5Consecutive6Days = (data, startDate, endDate, mode, consecutiveDays = 6) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const calculateSum = (num) => {
        if (num === 0) return 10;
        const head = Math.floor(num / 10);
        const tail = num % 10;
        const sum = (head + tail) % 10;
        return sum === 0 ? 10 : sum;
    };

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const hasSumGreaterThan5EachDay = numbersPerDay.every(numbers =>
            numbers.some(num => calculateSum(num) > 5)
        );

        if (hasSumGreaterThan5EachDay) {
            const allSums = [...new Set(numbersPerDay.flatMap(numbers =>
                numbers.map(num => calculateSum(num)).filter(sum => sum > 5)
            ))];
            const allValidNumbers = [...new Set(numbersPerDay.flatMap(numbers =>
                numbers.filter(num => calculateSum(num) > 5)
            ))];
            results.push({
                sums: allSums.length > 0 ? allSums : ['Không có tổng > 5'],
                numbers: allValidNumbers.length > 0 ? allValidNumbers : ['Không có số nào'],
                dates: days.map(day => day.date),
                results: days.map(day => ({ date: day.date, numbers: getNumbersByMode(day, mode) }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

const findSumLessThan5Consecutive6Days = (data, startDate, endDate, mode, consecutiveDays = 6) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const calculateSum = (num) => {
        if (num === 0) return 10;
        const head = Math.floor(num / 10);
        const tail = num % 10;
        const sum = (head + tail) % 10;
        return sum === 0 ? 10 : sum;
    };

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const hasSumLessThan5EachDay = numbersPerDay.every(numbers =>
            numbers.some(num => calculateSum(num) < 5)
        );

        if (hasSumLessThan5EachDay) {
            const allSums = [...new Set(numbersPerDay.flatMap(numbers =>
                numbers.map(num => calculateSum(num)).filter(sum => sum < 5)
            ))];
            const allValidNumbers = [...new Set(numbersPerDay.flatMap(numbers =>
                numbers.filter(num => calculateSum(num) < 5)
            ))];
            results.push({
                sums: allSums.length > 0 ? allSums : ['Không có tổng < 5'],
                numbers: allValidNumbers.length > 0 ? allValidNumbers : ['Không có số nào'],
                dates: days.map(day => day.date),
                results: days.map(day => ({ date: day.date, numbers: getNumbersByMode(day, mode) }))
            });
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

const findSumEqualTo5Consecutive3Days = (data, startDate, endDate, mode, consecutiveDays = 3) => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    const filteredData = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const calculateSum = (num) => {
        if (num === 0) return 10;
        const head = Math.floor(num / 10);
        const tail = num % 10;
        const sum = (head + tail) % 10;
        return sum === 0 ? 10 : sum;
    };

    for (let i = 0; i < filteredData.length - (consecutiveDays - 1); i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const sumsMap = {};

        numbersPerDay.forEach((numbers, dayIndex) => {
            numbers.forEach(num => {
                const sum = calculateSum(num);
                if (sum === 5) {
                    if (!sumsMap[sum]) sumsMap[sum] = Array(consecutiveDays).fill(false);
                    sumsMap[sum][dayIndex] = true;
                }
            });
        });

        for (const sum in sumsMap) {
            if (sumsMap[sum].every(day => day === true)) {
                const allValidNumbers = numbersPerDay.flatMap(numbers =>
                    numbers.filter(num => calculateSum(num) === parseInt(sum, 10))
                );
                results.push({
                    sum: parseInt(sum, 10),
                    numbers: [...new Set(allValidNumbers)],
                    dates: days.map(day => day.date),
                    results: days.map(day => ({ date: day.date, numbers: getNumbersByMode(day, mode) }))
                });
            }
        }
    }

    const limitedResults = results.slice(0, 200);
    const total = results.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
    return { results: limitedResults, total, message };
};

const findIncreasingNumbers = (data, startDate, endDate, type, mode, consecutiveDays = 2, pattern = 'monotonic') => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    if (consecutiveDays < 2) consecutiveDays = 2;
    if (consecutiveDays > 20) consecutiveDays = 20;

    const filteredData = data
        .filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const extractFunc = type === 'head' ? (num) => Math.floor(num / 10) : (num) => num % 10;

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const extractedPerDay = numbersPerDay.map(numbers => [...new Set(numbers.map(extractFunc))]);

        // ================================================================
        // [CẬP NHẬT LOGIC] Xử lý 2 loại pattern khác nhau
        // ================================================================
        if (pattern === 'arithmetic') { // Kiểu "dần đều" (ví dụ: 1-2-3)
            for (const startValue of extractedPerDay[0]) {
                const expectedSequence = Array.from({ length: consecutiveDays }, (_, idx) => startValue + idx);
                let isSequenceValid = true;
                for (let j = 1; j < consecutiveDays; j++) {
                    if (!extractedPerDay[j].includes(expectedSequence[j])) {
                        isSequenceValid = false;
                        break;
                    }
                }
                if (isSequenceValid) {
                     const validNumbers = numbersPerDay.map((numbers, idx) => numbers.filter(num => extractFunc(num) === expectedSequence[idx]));
                     results.push({ numbers: expectedSequence, type, dates: days.map(d => d.date), results: days.map((day, idx) => ({ date: day.date, numbers: getNumbersByMode(day, mode), extracted: validNumbers[idx] })) });
                }
            }
        } else { // Kiểu "dần" (monotonic - mặc định, ví dụ: 1-3-5)
            const findSequences = (dayIndex, currentSequence) => {
                if (currentSequence.length === consecutiveDays) {
                    const validNumbers = numbersPerDay.map((numbers, idx) => numbers.filter(num => extractFunc(num) === currentSequence[idx]));
                    results.push({ numbers: currentSequence, type, dates: days.map(d => d.date), results: days.map((day, idx) => ({ date: day.date, numbers: getNumbersByMode(day, mode), extracted: validNumbers[idx] })) });
                    return;
                }
                const lastValue = currentSequence.length > 0 ? currentSequence[currentSequence.length - 1] : -1;
                for (const value of extractedPerDay[dayIndex]) {
                    if (value > lastValue) {
                        findSequences(dayIndex + 1, [...currentSequence, value]);
                    }
                }
            };
            findSequences(0, []);
        }
    }

    const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item.numbers) + JSON.stringify(item.dates), item])).values()];
    const limitedResults = uniqueResults.slice(0, 200);
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};

const findDecreasingNumbers = (data, startDate, endDate, type, mode, consecutiveDays = 2, pattern = 'monotonic') => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: "Dữ liệu đầu vào không hợp lệ" };
    }

    if (consecutiveDays < 2) consecutiveDays = 2;
    if (consecutiveDays > 20) consecutiveDays = 20;

    const filteredData = data
        .filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const extractFunc = type === 'head' ? (num) => Math.floor(num / 10) : (num) => num % 10;

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => getNumbersByMode(day, mode));
        const extractedPerDay = numbersPerDay.map(numbers => [...new Set(numbers.map(extractFunc))]);

        // ================================================================
        // [CẬP NHẬT LOGIC] Xử lý 2 loại pattern khác nhau
        // ================================================================
        if (pattern === 'arithmetic') { // Kiểu "dần đều" (ví dụ: 3-2-1)
            for (const startValue of extractedPerDay[0]) {
                const expectedSequence = Array.from({ length: consecutiveDays }, (_, idx) => startValue - idx);
                let isSequenceValid = true;
                for (let j = 1; j < consecutiveDays; j++) {
                    if (!extractedPerDay[j].includes(expectedSequence[j])) {
                        isSequenceValid = false;
                        break;
                    }
                }
                if (isSequenceValid) {
                     const validNumbers = numbersPerDay.map((numbers, idx) => numbers.filter(num => extractFunc(num) === expectedSequence[idx]));
                     results.push({ numbers: expectedSequence, type, dates: days.map(d => d.date), results: days.map((day, idx) => ({ date: day.date, numbers: getNumbersByMode(day, mode), extracted: validNumbers[idx] })) });
                }
            }
        } else { // Kiểu "dần" (monotonic - mặc định, ví dụ: 5-3-1)
            const findSequences = (dayIndex, currentSequence) => {
                if (currentSequence.length === consecutiveDays) {
                    const validNumbers = numbersPerDay.map((numbers, idx) => numbers.filter(num => extractFunc(num) === currentSequence[idx]));
                    results.push({ numbers: currentSequence, type, dates: days.map(d => d.date), results: days.map((day, idx) => ({ date: day.date, numbers: getNumbersByMode(day, mode), extracted: validNumbers[idx] })) });
                    return;
                }
                const lastValue = currentSequence.length > 0 ? currentSequence[currentSequence.length - 1] : 10;
                for (const value of extractedPerDay[dayIndex]) {
                    if (value < lastValue) {
                        findSequences(dayIndex + 1, [...currentSequence, value]);
                    }
                }
            };
            findSequences(0, []);
        }
    }

    const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item.numbers) + JSON.stringify(item.dates), item])).values()];
    const limitedResults = uniqueResults.slice(0, 200);
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};


const findConsecutiveIncreasingNumbers = (data, startDate, endDate, mode, consecutiveDays = 2, pattern = 'monotonic') => {
    const results = [];
    if (!Array.isArray(data)) return { results: [], total: 0, message: "Dữ liệu không hợp lệ" };
    if (consecutiveDays < 2) consecutiveDays = 2;
    if (consecutiveDays > 20) consecutiveDays = 20;

    const filteredData = data
        .filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => [...new Set(getNumbersByMode(day, mode))]);

        if (pattern === 'arithmetic') { // Kiểu "dần đều" (ví dụ: 25-26-27)
            for (const startValue of numbersPerDay[0]) {
                const expectedSequence = Array.from({ length: consecutiveDays }, (_, idx) => startValue + idx);
                let isSequenceValid = true;
                for (let j = 1; j < consecutiveDays; j++) {
                    if (!numbersPerDay[j].includes(expectedSequence[j])) {
                        isSequenceValid = false;
                        break;
                    }
                }
                if (isSequenceValid) {
                    // SỬA LỖI: đổi 'matched' -> 'extracted'
                    results.push({ numbers: expectedSequence, dates: days.map(d => d.date), results: days.map((day, idx) => ({ date: day.date, numbers: getNumbersByMode(day, mode), extracted: [expectedSequence[idx]] })) });
                }
            }
        } else { // Kiểu "dần" (monotonic - mặc định, ví dụ: 25-30-45)
            const findSequences = (dayIndex, currentSequence) => {
                if (currentSequence.length === consecutiveDays) {
                    // SỬA LỖI: đổi 'matched' -> 'extracted'
                    results.push({ numbers: currentSequence, dates: days.map(d => d.date), results: days.map((day, idx) => ({ date: day.date, numbers: getNumbersByMode(day, mode), extracted: [currentSequence[idx]] })) });
                    return;
                }
                const lastValue = currentSequence.length > 0 ? currentSequence[currentSequence.length - 1] : -1;
                for (const num of numbersPerDay[dayIndex]) {
                    if (num > lastValue) {
                        findSequences(dayIndex + 1, [...currentSequence, num]);
                    }
                }
            };
            findSequences(0, []);
        }
    }

    const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item.numbers) + JSON.stringify(item.dates), item])).values()];
    const limitedResults = uniqueResults.slice(0, 200);
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};

const findConsecutiveDecreasingNumbers = (data, startDate, endDate, mode, consecutiveDays = 2, pattern = 'monotonic') => {
    const results = [];
    if (!Array.isArray(data)) return { results: [], total: 0, message: "Dữ liệu không hợp lệ" };
    if (consecutiveDays < 2) consecutiveDays = 2;
    if (consecutiveDays > 20) consecutiveDays = 20;

    const filteredData = data
        .filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => [...new Set(getNumbersByMode(day, mode))]);

        if (pattern === 'arithmetic') { // Kiểu "dần đều" (ví dụ: 27-26-25)
            for (const startValue of numbersPerDay[0]) {
                const expectedSequence = Array.from({ length: consecutiveDays }, (_, idx) => startValue - idx);
                let isSequenceValid = true;
                for (let j = 1; j < consecutiveDays; j++) {
                    if (!numbersPerDay[j].includes(expectedSequence[j])) {
                        isSequenceValid = false;
                        break;
                    }
                }
                if (isSequenceValid) {
                    // SỬA LỖI: đổi 'matched' -> 'extracted'
                    results.push({ numbers: expectedSequence, dates: days.map(d => d.date), results: days.map((day, idx) => ({ date: day.date, numbers: getNumbersByMode(day, mode), extracted: [expectedSequence[idx]] })) });
                }
            }
        } else { // Kiểu "dần" (monotonic - mặc định, ví dụ: 45-30-25)
            const findSequences = (dayIndex, currentSequence) => {
                if (currentSequence.length === consecutiveDays) {
                    // SỬA LỖI: đổi 'matched' -> 'extracted'
                    results.push({ numbers: currentSequence, dates: days.map(d => d.date), results: days.map((day, idx) => ({ date: day.date, numbers: getNumbersByMode(day, mode), extracted: [currentSequence[idx]] })) });
                    return;
                }
                const lastValue = currentSequence.length > 0 ? currentSequence[currentSequence.length - 1] : 100;
                for (const num of numbersPerDay[dayIndex]) {
                    if (num < lastValue) {
                        findSequences(dayIndex + 1, [...currentSequence, num]);
                    }
                }
            };
            findSequences(0, []);
        }
    }

    const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item.numbers) + JSON.stringify(item.dates), item])).values()];
    const limitedResults = uniqueResults.slice(0, 200);
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};

// Hàm tính tổng của một số
const calculateSum = (number, sumType = 'traditional') => {
    const digits = number.toString().padStart(2, '0').split('').map(Number);
    const head = digits[0];
    const tail = digits[1];
    const rawSum = head + tail;

    if (sumType === 'new') {
        return rawSum; // Kiểu mới: Tổng tuyệt đối của head + tail
    } else {
        // Kiểu truyền thống: Lấy phần đơn vị, 00 là trường hợp đặc biệt
        if (number === 0 || number === '00') {
            return 10;
        }
        return rawSum % 10 === 0 ? 10 : rawSum % 10;
    }
};

// Danh sách các số theo tổng cho kiểu truyền thống (1-10) và kiểu mới (0-18)
const sumLists = {
    traditional: {
        1: [1, 10, 29, 38, 47, 56, 65, 74, 83, 92],
        2: [2, 11, 20, 39, 48, 57, 66, 75, 84, 93],
        3: [3, 12, 21, 30, 49, 58, 67, 76, 85, 94],
        4: [4, 13, 22, 31, 40, 59, 68, 77, 86, 95],
        5: [5, 14, 23, 32, 41, 50, 69, 78, 87, 96],
        6: [6, 15, 24, 33, 42, 51, 60, 79, 88, 97],
        7: [7, 16, 25, 34, 43, 52, 61, 70, 89, 98],
        8: [8, 17, 26, 35, 44, 53, 62, 71, 80, 99],
        9: [9, 18, 27, 36, 45, 54, 63, 72, 81, 90],
        10: [19, 28, 37, 46, 55, 64, 73, 82, 91]
    },
    new: {
        0: [0],
        1: [1, 10],
        2: [2, 11, 20],
        3: [3, 12, 21, 30],
        4: [4, 13, 22, 31, 40],
        5: [5, 14, 23, 32, 41, 50],
        6: [6, 15, 24, 33, 42, 51, 60],
        7: [7, 16, 25, 34, 43, 52, 61, 70],
        8: [8, 17, 26, 35, 44, 53, 62, 71, 80],
        9: [9, 18, 27, 36, 45, 54, 63, 72, 81, 90],
        10: [19, 28, 37, 46, 55, 64, 73, 82, 91],
        11: [29, 38, 47, 56, 65, 74, 83, 92],
        12: [39, 48, 57, 66, 75, 84, 93],
        13: [49, 58, 67, 76, 85, 94],
        14: [59, 68, 77, 86, 95],
        15: [69, 78, 87, 96],
        16: [79, 88, 97],
        17: [89, 98],
        18: [99]
    }
};


// Hàm xác định dạng chẵn lẻ của số
const findParitySequenceNumbers = (data, startDate, endDate, mode, consecutiveDays, parityType, pattern = 'monotonic_increasing') => {
    const results = [];
    if (!Array.isArray(data)) {
        return { results: [], total: 0, message: 'Dữ liệu không hợp lệ.' };
    }

    const direction = pattern.includes('increasing') ? 'ascending' : (pattern.includes('decreasing') ? 'descending' : null);

    const isParityMatch = (num, type) => {
        const parsedNum = parseInt(num, 10);
        if (isNaN(parsedNum)) return false;
        const head = Math.floor(parsedNum / 10);
        const tail = parsedNum % 10;
        const headIsEven = head % 2 === 0;
        const tailIsEven = tail % 2 === 0;
        switch (type) {
            case 'even-even': return headIsEven && tailIsEven;
            case 'even-odd': return headIsEven && !tailIsEven;
            case 'odd-even': return !headIsEven && tailIsEven;
            case 'odd-odd': return !headIsEven && !tailIsEven;
            default: return false;
        }
    };
    
    const isArithmetic = (sequence) => {
        if (sequence.length <= 1) return true;
        const diff = sequence[1] - sequence[0];
        if (diff === 0) return false;
        // Các số cùng dạng chẵn/lẻ thường cách nhau 2 đơn vị (vd: 22, 24, 26)
        if (Math.abs(diff) !== 2) return false; 
        for (let i = 2; i < sequence.length; i++) {
            if (sequence[i] - sequence[i - 1] !== diff) return false;
        }
        return true;
    };

    const filteredData = data
        .filter(entry => new Date(entry.date) >= new Date(startDate) && new Date(entry.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredData.length < consecutiveDays) {
        return { results: [], total: 0, message: 'Không đủ dữ liệu.' };
    }

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const numbersPerDay = days.map(day => 
            [...new Set(getNumbersByMode(day, mode).filter(num => isParityMatch(num, parityType)))]
        );

        if (numbersPerDay.some(numbers => numbers.length === 0)) continue;

        if (pattern === 'consecutive_occurrence') {
            const sequence = numbersPerDay.map(dayNumbers => dayNumbers[0]);
            results.push({
                numbers: sequence,
                dates: days.map(d => d.date),
                results: days.map((day, idx) => ({
                    date: day.date,
                    numbers: getNumbersByMode(day, mode),
                    extracted: numbersPerDay[idx]
                }))
            });
            continue;
        }
        
        const findSequencesRecursive = (dayIndex, currentSequence) => {
            if (currentSequence.length === consecutiveDays) {
                if (pattern.includes('arithmetic') && !isArithmetic(currentSequence)) {
                    return;
                }
                results.push({
                    numbers: currentSequence,
                    dates: days.map(d => d.date),
                    results: days.map((day, idx) => ({
                        date: day.date,
                        numbers: getNumbersByMode(day, mode),
                        extracted: currentSequence.filter(val => numbersPerDay[idx].includes(val))
                    }))
                });
                return;
            }
            const lastValue = currentSequence.length > 0 ? currentSequence[currentSequence.length - 1] : (direction === 'ascending' ? -1 : 100);
            for (const num of numbersPerDay[dayIndex]) {
                const condition = direction === 'ascending' ? num > lastValue : num < lastValue;
                if (condition) {
                    findSequencesRecursive(dayIndex + 1, [...currentSequence, num]);
                }
            }
        };
        findSequencesRecursive(0, []);
    }

    const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item.numbers) + JSON.stringify(item.dates), item])).values()];
    const limitedResults = uniqueResults.slice(0, 200);
    const total = uniqueResults.length;
    const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên" : "";
    return { results: limitedResults, total, message };
};


const findNumbersInRange = (data, startDate, endDate, mode) => {
    try {
        if (!Array.isArray(data)) {
            return { results: [], total: 0, message: 'Dữ liệu đầu vào không hợp lệ' };
        }
        // Filter data by date range
        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        });
        // Aggregate numbers, their dates, and occurrences
        const numberMap = new Map();
        filteredData.forEach(entry => {
            const numbers = getNumbersByMode(entry, mode).map(num => String(num).padStart(2, '0'));
            numbers.forEach(num => {
                if (numberMap.has(num)) {
                    const record = numberMap.get(num);
                    record.occurrences += 1;
                    if (!record.dates.includes(entry.date)) {
                        record.dates.push(entry.date);
                    }
                } else {
                    numberMap.set(num, {
                        number: num,
                        dates: [entry.date],
                        occurrences: 1
                    });
                }
            });
        });
        // Convert Map to results array
        const results = Array.from(numberMap.values())
            .map(record => ({
                number: record.number,
                dates: record.dates.sort(), // Sort for consistency
                occurrences: record.occurrences
            }))
            .sort((a, b) => a.number - b.number);
        
        const total = results.length;
        const message = total > 200 ? 'Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn' :
                        total === 0 ? 'Không tìm thấy số nào trong khoảng thời gian này' : '';
        return { results: results.slice(0, 200), total, message };
    } catch (error) {
        return { results: [], total: 0, message: 'Lỗi khi tìm kiếm số trong khoảng thời gian' };
    }
};

// Hàm tìm các tổng kiểu mới về sole theo cặp
const findNewSumSolePairs = (data, startDate, endDate, mode, consecutiveDays = 2) => {
    try {
        if (!Array.isArray(data)) {
            return { results: [], total: 0, message: 'Dữ liệu không hợp lệ.' };
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

        const results = [];
        
        // Định nghĩa các cặp tổng sole
        const sumPairs = [
            { sum1: 0, sum2: 18 },
            { sum1: 1, sum2: 17 },
            { sum1: 2, sum2: 16 },
            { sum1: 3, sum2: 15 },
            { sum1: 4, sum2: 14 },
            { sum1: 5, sum2: 13 },
            { sum1: 6, sum2: 12 },
            { sum1: 7, sum2: 11 },
            { sum1: 8, sum2: 10 }
        ];

        // Danh sách số có tổng 9
        const sum9Numbers = {
            evenHead: [9, 27, 45, 63, 81], // Đầu chẵn
            oddHead: [18, 36, 54, 72, 90]  // Đầu lẻ
        };

        // Xử lý các cặp tổng thông thường
        for (const pair of sumPairs) {
            for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
                const days = filteredData.slice(i, i + consecutiveDays);
                
                // Kiểm tra pattern sole (A-B-A-B hoặc B-A-B-A)
                const patterns = [
                    Array(consecutiveDays).fill(null).map((_, idx) => idx % 2 === 0 ? pair.sum1 : pair.sum2),
                    Array(consecutiveDays).fill(null).map((_, idx) => idx % 2 === 0 ? pair.sum2 : pair.sum1)
                ];

                for (const pattern of patterns) {
                    let isValid = true;
                    const matchedNumbers = [];

                    for (let j = 0; j < consecutiveDays; j++) {
                        const numbers = getNumbersByMode(days[j], mode);
                        const expectedSum = pattern[j];
                        
                        const matching = numbers.filter(num => 
                            calculateSum(Number(num) % 100, 'new') === expectedSum
                        );

                        if (matching.length === 0) {
                            isValid = false;
                            break;
                        }
                        matchedNumbers.push(matching);
                    }

                    if (isValid) {
                        results.push({
                            sumPair: `${pair.sum1} - ${pair.sum2}`,
                            pattern: pattern,
                            numbers: matchedNumbers,
                            dates: days.map(day => day.date),
                            results: days.map((day, idx) => ({
                                date: day.date,
                                numbers: getNumbersByMode(day, mode),
                                sum: pattern[idx]
                            }))
                        });
                    }
                }
            }
        }

        // Xử lý đặc biệt cho tổng 9
        for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
            const days = filteredData.slice(i, i + consecutiveDays);
            let isValid = true;
            const matchedNumbers = [];
            const pattern = [];

            for (let j = 0; j < consecutiveDays; j++) {
                const numbers = getNumbersByMode(days[j], mode);
                const sum9InDay = numbers.filter(num => 
                    calculateSum(Number(num) % 100, 'new') === 9
                );

                if (sum9InDay.length === 0) {
                    isValid = false;
                    break;
                }

                // Kiểm tra pattern đầu chẵn/lẻ sole
                if (j === 0) {
                    // Ngày đầu tiên - xác định pattern
                    const hasEvenHead = sum9InDay.some(num => sum9Numbers.evenHead.includes(Number(num) % 100));
                    const hasOddHead = sum9InDay.some(num => sum9Numbers.oddHead.includes(Number(num) % 100));
                    
                    if (hasEvenHead && !hasOddHead) {
                        pattern.push('even');
                    } else if (hasOddHead && !hasEvenHead) {
                        pattern.push('odd');
                    } else {
                        isValid = false;
                        break;
                    }
                } else {
                    // Các ngày tiếp theo - kiểm tra sole
                    const expectedType = pattern[0] === 'even' ? 
                        (j % 2 === 0 ? 'even' : 'odd') : 
                        (j % 2 === 0 ? 'odd' : 'even');
                    
                    const hasExpected = sum9InDay.some(num => {
                        const n = Number(num) % 100;
                        return expectedType === 'even' ? 
                            sum9Numbers.evenHead.includes(n) : 
                            sum9Numbers.oddHead.includes(n);
                    });

                    if (!hasExpected) {
                        isValid = false;
                        break;
                    }
                    pattern.push(expectedType);
                }

                matchedNumbers.push(sum9InDay);
            }

            if (isValid) {
                results.push({
                    sumPair: 'Tổng 9 (Đầu chẵn/lẻ sole)',
                    pattern: pattern,
                    numbers: matchedNumbers,
                    dates: days.map(day => day.date),
                    results: days.map((day, idx) => ({
                        date: day.date,
                        numbers: getNumbersByMode(day, mode),
                        sum: 9,
                        headType: pattern[idx]
                    }))
                });
            }
        }

        const limitedResults = results.slice(0, 200);
        const total = results.length;
        const message = total > 200 ? "Chỉ hiển thị 200 trường hợp đầu tiên do dữ liệu quá lớn" : "";
        
        return { results: limitedResults, total, message };
    } catch (error) {
        console.error('Error in findNewSumSolePairs:', error);
        return { results: [], total: 0, message: 'Lỗi khi xử lý dữ liệu.' };
    }
};


// Hàm trợ giúp để lấy ngày hiện tại (ngày mới nhất trong dữ liệu)
const getLatestDate = (data) => {
    if (!data || data.length === 0) {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    // Dữ liệu được sắp xếp từ cũ đến mới, nên ngày cuối cùng là ngày mới nhất
    return data[data.length-1].date;
};

// Lấy ngày đầu tiên trong bộ dữ liệu
const getEarliestDate = (data) => {
    if (!data || data.length === 0) {
        // Trả về một ngày mặc định nếu dữ liệu rỗng
        return '2005-01-01';
    }
    // Giả sử dữ liệu đã được sắp xếp từ cũ đến mới
    return data[0].date;
};

// Hàm trợ giúp để tìm chuỗi liên tiếp dài nhất
// File: services/lotteryService.js

// THAY THẾ TOÀN BỘ HÀM CŨ BẰNG PHIÊN BẢN HOÀN CHỈNH NÀY
const findLongestConsecutiveRun = (statisticResults, allDatesInChronologicalOrder) => {
    if (!statisticResults || statisticResults.length === 0) {
        return { length: 0, startDate: null, endDate: null, matchingNumbers: [] };
    }

    // BƯỚC 1: Tái cấu trúc dữ liệu, nhóm các ngày theo từng trường hợp (số, đầu, đít)
    const statsMap = new Map();
    for (const item of statisticResults) {
        const numbers = Array.isArray(item.numbers) ? item.numbers : [item.number].filter(n => n !== undefined && n !== null);
        const dates = item.dates || [];
        for (const num of numbers) {
            const numKey = String(num);
            if (!statsMap.has(numKey)) {
                statsMap.set(numKey, new Set());
            }
            const dateSet = statsMap.get(numKey);
            for (const date of dates) {
                dateSet.add(new Date(date).toISOString().split('T')[0]); // Chuẩn hóa ngày
            }
        }
    }

    const candidateRuns = [];

    // BƯỚC 2: Tìm chuỗi dài nhất cho TỪNG TRƯỜNG HỢP một cách độc lập
    for (const [number, dateSet] of statsMap.entries()) {
        if (dateSet.size === 0) continue;

        let currentStreak = 0;
        let maxStreak = 0;
        let endDateOfMaxStreak = null;

        // Duyệt qua toàn bộ lịch sử quay thưởng
        for (const dateStr of allDatesInChronologicalOrder) {
            // ==========================================================
            // ===   SỬA LỖI DUY NHẤT NẰM Ở ĐÂY   ===
            // Chuẩn hóa ngày từ danh sách tổng về cùng định dạng YYYY-MM-DD trước khi so sánh
            const normalizedMasterDate = new Date(dateStr).toISOString().split('T')[0];
            // ==========================================================

            if (dateSet.has(normalizedMasterDate)) {
                currentStreak++;
            } else {
                currentStreak = 0;
            }

            if (currentStreak >= maxStreak) {
                maxStreak = currentStreak;
                endDateOfMaxStreak = dateStr; // Lưu lại ngày gốc chưa chuẩn hóa
            }
        }

        if (maxStreak > 0) {
            const endIndex = allDatesInChronologicalOrder.indexOf(endDateOfMaxStreak);
            const startIndex = endIndex - maxStreak + 1;
            const startDateOfMaxStreak = allDatesInChronologicalOrder[startIndex];
            
            candidateRuns.push({
                length: maxStreak,
                startDate: startDateOfMaxStreak,
                endDate: endDateOfMaxStreak,
                number: parseInt(number, 10)
            });
        }
    }

    if (candidateRuns.length === 0) {
        return { length: 0, startDate: null, endDate: null, matchingNumbers: [] };
    }
    
    // BƯỚC 3: Xử lý danh sách ứng viên để tìm ra nhà vô địch cuối cùng
    const maxLength = Math.max(...candidateRuns.map(r => r.length));
    const recordLengthRuns = candidateRuns.filter(r => r.length === maxLength);
    const mostRecentEndDate = new Date(Math.max(...recordLengthRuns.map(r => new Date(r.endDate))));
    const finalRuns = recordLengthRuns.filter(r => new Date(r.endDate).getTime() === mostRecentEndDate.getTime());

    // BƯỚC 4: Tổng hợp kết quả
    const finalResult = {
        length: finalRuns[0].length,
        startDate: finalRuns[0].startDate,
        endDate: finalRuns[0].endDate,
        matchingNumbers: finalRuns.map(r => r.number).sort((a, b) => a - b)
    };

    return finalResult;
};

// Cập nhật hàm analyzeCurrentStreaks để đọc minDays
const analyzeCurrentStreaks = (data, statFunctionsMap) => {
    const analysisWindow = 30;
    if (!data || data.length < analysisWindow) {
        return { message: "Không đủ dữ liệu để phân tích." };
    }

    const latestDateStr = getLatestDate(data);
    const recentData = data.slice(-analysisWindow);
    const allRecentDates = recentData.map(d => d.date);
    const streaksByLength = {};

    for (let k = 2; k <= analysisWindow; k++) {
        const streakEndDate = latestDateStr;
        const streakStartDate = allRecentDates[allRecentDates.length - k];
        if (!streakStartDate) break;

        let foundAnyStatForLengthK = false;
        
        for (const [statName, statInfo] of Object.entries(statFunctionsMap)) {
            // KIỂM TRA ĐIỀU KIỆN TỐI THIỂU
            if (k < statInfo.minDays) {
                continue; // Bỏ qua nếu chưa đủ số ngày tối thiểu
            }

            try {
                const { results } = statInfo.func(data, streakStartDate, streakEndDate, k);
                if (results && results.length > 0) {
                    if (!streaksByLength[k]) streaksByLength[k] = [];
                    streaksByLength[k].push({ statName: statName, details: results });
                    foundAnyStatForLengthK = true;
                }
            } catch (e) { /* Bỏ qua lỗi */ }
        }
        
        if (!foundAnyStatForLengthK) break;
    }
    
    return {
        latestDate: latestDateStr,
        streaks: streaksByLength
    };
};

/**
 * Tính toán chuỗi không xuất hiện (gan) cho tất cả các số từ 00-99.
 * @param {Array} data - Toàn bộ dữ liệu xổ số.
 * @returns {Array} - Mảng các đối tượng, mỗi đối tượng chứa thông tin gan cho một số.
 */
const calculateAbsenceStreaks = (data) => {
    if (!data || data.length === 0) {
        return [];
    }

    const allDates = data.map(d => d.date);
    const latestDate = new Date(allDates[allDates.length - 1]);
    const results = [];

    // Lặp qua từng số từ 00 đến 99
    for (let num = 0; num < 100; num++) {
        const appearances = new Set();
        data.forEach(day => {
            const numbersInDay = getNumbersByMode(day, 'lo'); // Luôn dùng mode 'lo'
            if (numbersInDay.includes(num)) {
                appearances.add(day.date);
            }
        });

        let absenceStreaks = [];
        let currentStreak = 0;
        let lastAppearanceDate = null;

        // Duyệt qua toàn bộ lịch sử để tìm các khoảng không xuất hiện
        for (let i = 0; i < allDates.length; i++) {
            const currentDate = allDates[i];
            if (appearances.has(currentDate)) {
                if (currentStreak > 0) {
                    const startDate = new Date(lastAppearanceDate);
                    startDate.setDate(startDate.getDate() + 1);
                    
                    const endDate = new Date(allDates[i-1]);

                    absenceStreaks.push({
                        length: currentStreak,
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0],
                    });
                }
                currentStreak = 0;
                lastAppearanceDate = currentDate;
            } else {
                currentStreak++;
            }
        }
        
        // Sắp xếp các chuỗi gan theo độ dài giảm dần
        absenceStreaks.sort((a, b) => b.length - a.length);

        // Tính chuỗi gan hiện tại
        let currentAbsence = 0;
        if(lastAppearanceDate) {
            const lastDate = new Date(lastAppearanceDate);
            // Tính số ngày từ lần cuối về đến ngày mới nhất
            currentAbsence = Math.round((latestDate - lastDate) / (1000 * 60 * 60 * 24)) -1;
        } else {
             currentAbsence = data.length; // Chưa về bao giờ
        }

        results.push({
            number: String(num).padStart(2, '0'),
            longest: absenceStreaks[0] || { length: 0 },
            secondLongest: absenceStreaks[1] || { length: 0 },
            thirdLongest: absenceStreaks[2] || { length: 0 },
            currentStreak: currentAbsence >= 3 ? currentAbsence : 0,
        });
    }

    return results;
};

/**
 * Phân tích tần suất các số xuất hiện vào ngày hôm sau khi một số cụ thể đã về.
 * @param {Array} data - Toàn bộ dữ liệu xổ số.
 * @param {number} targetNumber - Số cần phân tích (0-99).
 * @returns {object} - Đối tượng chứa kết quả phân tích.
 */
const analyzeNextDayOccurrences = (data, targetNumber) => {
    const frequencyMap = new Map();
    let totalOccurrences = 0;

    // Tìm tất cả các chỉ số (index) của những ngày mà targetNumber xuất hiện
    const targetDaysIndices = [];
    data.forEach((day, index) => {
        const numbersInDay = getNumbersByMode(day, 'lo'); // Luôn dùng mode 'lo'
        if (numbersInDay.includes(targetNumber)) {
            targetDaysIndices.push(index);
        }
    });

    totalOccurrences = targetDaysIndices.length;
    if (totalOccurrences === 0) {
        return { results: [], totalOccurrences: 0, message: `Số ${String(targetNumber).padStart(2, '0')} chưa xuất hiện lần nào trong dữ liệu.` };
    }

    // Với mỗi ngày tìm được, xem các số của ngày hôm sau
    targetDaysIndices.forEach(index => {
        if (index + 1 < data.length) { // Đảm bảo có ngày hôm sau
            const nextDay = data[index + 1];
            const nextDayNumbers = getNumbersByMode(nextDay, 'lo');
            nextDayNumbers.forEach(num => {
                frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
            });
        }
    });

    // Chuyển Map thành mảng, tính toán tần suất và sắp xếp
    const results = Array.from(frequencyMap.entries())
        .map(([number, count]) => ({
            number: String(number).padStart(2, '0'),
            count,
            percentage: ((count / totalOccurrences) * 100).toFixed(2)
        }))
        .sort((a, b) => b.count - a.count); // Sắp xếp theo số lần xuất hiện giảm dần

    const message = `Phân tích cho số ${String(targetNumber).padStart(2, '0')}, đã xuất hiện tổng cộng ${totalOccurrences} lần.`;
    return { results, totalOccurrences, message };
};

const isParityMatch = (num, type) => {
    const parsedNum = parseInt(num, 10);
    if (isNaN(parsedNum)) return false;
    const head = Math.floor(parsedNum / 10);
    const tail = parsedNum % 10;
    const headIsEven = head % 2 === 0;
    const tailIsEven = tail % 2 === 0;
    switch (type) {
        case 'even-even': return headIsEven && tailIsEven;
        case 'even-odd': return headIsEven && !tailIsEven;
        case 'odd-even': return !headIsEven && tailIsEven;
        case 'odd-odd': return !headIsEven && !tailIsEven;
        default: return false;
    }
};

const findHeadTailSizeSequences = (data, startDate, endDate, mode, consecutiveDays, pattern, sizeType) => {
    
    const isSizeMatch = (num) => {
        const head = Math.floor(num / 10);
        const tail = num % 10;
        const isHeadBig = head >= 5; // Đầu to
        const isTailBig = tail >= 5; // Đít to

        switch(sizeType) {
            case 'big-big': return isHeadBig && isTailBig;       // Đầu to - Đít to
            case 'big-small': return isHeadBig && !isTailBig;      // Đầu to - Đít nhỏ
            case 'small-big': return !isHeadBig && isTailBig;      // Đầu nhỏ - Đít to
            case 'small-small': return !isHeadBig && !isTailBig;   // Đầu nhỏ - Đít nhỏ
            default: return false;
        }
    };

    // Tái sử dụng hàm logic chung đã có
    return findSpecialNumberSequences(data, startDate, endDate, mode, consecutiveDays, pattern, isSizeMatch);
};

// 1. Hàm hỗ trợ tính Hiệu
const calculateDifference = (num) => {
    const head = Math.floor(num / 10);
    const tail = num % 10;
    return Math.abs(head - tail);
};

// 2. Danh sách các số được sắp xếp theo từng Hiệu
const differenceLists = {
    0: [0, 11, 22, 33, 44, 55, 66, 77, 88, 99],
    1: [1, 10, 12, 21, 23, 32, 34, 43, 45, 54, 56, 65, 67, 76, 78, 87, 89, 98],
    2: [2, 13, 20, 24, 31, 35, 42, 46, 53, 57, 64, 68, 75, 79, 86, 97],
    3: [3, 14, 25, 30, 36, 41, 47, 52, 58, 63, 69, 74, 85, 96],
    4: [4, 15, 26, 37, 40, 48, 51, 59, 62, 73, 84, 95],
    5: [5, 16, 27, 38, 49, 50, 61, 72, 83, 94],
    6: [6, 17, 28, 39, 60, 71, 82, 93],
    7: [7, 18, 29, 70, 81, 92],
    8: [8, 19, 80, 91],
    9: [9, 90]
};

// 3. Hàm thống kê Hiệu chính (tương tự findAdvancedSumSequences)
// File: lotteryService.js
const findDifferenceSequences = (data, options) => {
    const { startDate, endDate, mode, consecutiveDays, analysisType, pattern, diffParity } = options;
    const results = [];

    const filteredData = data.filter(item => new Date(item.date) >= new Date(startDate) && new Date(item.date) <= new Date(endDate))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredData.length < consecutiveDays) return { results: [], total: 0, message: 'Không đủ dữ liệu.' };

    // [SỬA LỖI] - Di chuyển hàm createResultObject lên đầu
    const createResultObject = (sequence, dayDetails, seqType, detailsPerDay) => {
        return {
            sequence: sequence,
            dates: dayDetails.map(d => d.date),
            results: dayDetails.map((day, idx) => {
                const originalNumbers = getNumbersByMode(day.dayData, mode);
                let extracted = [];
                if (seqType === 'number') {
                    extracted = (pattern === 'consecutive_occurrence') ? detailsPerDay[idx] : [sequence[idx]];
                } else { // 'difference'
                    const targetDiff = sequence[idx];
                    extracted = originalNumbers.filter(n => calculateDifference(n) === targetDiff);
                }
                return { date: day.date, numbers: originalNumbers, extracted };
            })
        };
    };

    for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
        const days = filteredData.slice(i, i + consecutiveDays);
        const dayDetails = days.map(d => ({ date: d.date, dayData: d }));

        // === NHÓM 1: CÁC SỐ CÙNG HIỆU ===
        if (analysisType === 'common_difference') {
            for (let diff = 0; diff <= 9; diff++) {
                const numbersWithDiffPerDay = days.map(day => 
                    [...new Set(getNumbersByMode(day, mode).filter(num => calculateDifference(num) === diff))].sort((a, b) => a - b)
                );
                if (numbersWithDiffPerDay.some(arr => arr.length === 0)) continue;
                
                if (pattern.includes('arithmetic')) {
                    const diffNumberList = differenceLists[diff];
                    if (!diffNumberList) continue;
                    let sequences = numbersWithDiffPerDay[0].map(val => [val]);
                    for (let dayIndex = 1; dayIndex < consecutiveDays; dayIndex++) {
                        const newSequences = [];
                        for (const seq of sequences) {
                            const lastValue = seq[seq.length - 1];
                            const lastValueIndex = diffNumberList.indexOf(lastValue);
                            if (lastValueIndex === -1) continue;
                            for (const nextValue of numbersWithDiffPerDay[dayIndex]) {
                                const nextValueIndex = diffNumberList.indexOf(nextValue);
                                let condition = (pattern.includes('increasing') && nextValueIndex === lastValueIndex + 1) || (pattern.includes('decreasing') && nextValueIndex === lastValueIndex - 1);
                                if (condition) newSequences.push([...seq, nextValue]);
                            }
                        }
                        sequences = newSequences;
                    }
                    sequences.forEach(seq => results.push(createResultObject(seq, dayDetails, 'number', numbersWithDiffPerDay)));
                } else if (pattern === 'consecutive_occurrence') {
                    const representativeSequence = numbersWithDiffPerDay.map(dayNumbers => dayNumbers[0]);
                    results.push(createResultObject(representativeSequence, dayDetails, 'number', numbersWithDiffPerDay));
                } else {
                    let sequences = numbersWithDiffPerDay[0].map(val => [val]);
                    for (let dayIndex = 1; dayIndex < consecutiveDays; dayIndex++) {
                        const newSequences = [];
                        for (const seq of sequences) {
                            const lastValue = seq[seq.length - 1];
                            for (const nextValue of numbersWithDiffPerDay[dayIndex]) {
                                let condition = (pattern.includes('increasing') && nextValue > lastValue) || (pattern.includes('decreasing') && nextValue < lastValue);
                                if (condition) newSequences.push([...seq, nextValue]);
                            }
                        }
                        sequences = newSequences;
                    }
                    sequences.forEach(seq => results.push(createResultObject(seq, dayDetails, 'number', numbersWithDiffPerDay)));
                }
            }
        }
        // === NHÓM 2 & 3: CÁC HIỆU & HIỆU CHẴN/LẺ ===
        else if (analysisType === 'difference_sequence') {
            const dayDetailsWithDiffs = days.map(day => {
                const values = new Set();
                getNumbersByMode(day, mode).forEach(num => {
                    const value = calculateDifference(num);
                    let isValid = (diffParity === 'any') || (diffParity === 'even' && value % 2 === 0) || (diffParity === 'odd' && value % 2 === 1);
                    if (isValid) values.add(value);
                });
                return { date: day.date, dayData: day, validDiffsList: [...values].sort((a,b) => a-b) };
            });

            if (dayDetailsWithDiffs.some(detail => detail.validDiffsList.length === 0)) continue;

            if (pattern === 'consecutive_occurrence') {
                const representativeSequence = dayDetailsWithDiffs.map(detail => detail.validDiffsList[0]);
                results.push(createResultObject(representativeSequence, dayDetails, 'difference', dayDetailsWithDiffs));
            } else {
                let sequences = dayDetailsWithDiffs[0].validDiffsList.map(val => [val]);
                for (let dayIndex = 1; dayIndex < consecutiveDays; dayIndex++) {
                    const newSequences = [];
                    for (const seq of sequences) {
                        const lastValue = seq[seq.length - 1];
                        for (const nextValue of dayDetailsWithDiffs[dayIndex].validDiffsList) {
                            let condition = false;
                            if (pattern.includes('arithmetic')) {
                                const diffStep = (diffParity !== 'any') ? 2 : 1;
                                if (pattern.includes('increasing')) condition = (nextValue === lastValue + diffStep);
                                else if (pattern.includes('decreasing')) condition = (nextValue === lastValue - diffStep);
                            } else {
                                if (pattern.includes('increasing')) condition = nextValue > lastValue;
                                else if (pattern.includes('decreasing')) condition = nextValue < lastValue;
                            }
                            if (condition) newSequences.push([...seq, nextValue]);
                        }
                    }
                    sequences = newSequences;
                }
                sequences.forEach(seq => results.push(createResultObject(seq, dayDetails, 'difference', dayDetailsWithDiffs)));
            }
        }
    }
    
    const uniqueResults = [...new Map(results.map(item => [JSON.stringify(item.sequence) + JSON.stringify(item.dates), item])).values()];
    const total = uniqueResults.length;
    return { results: uniqueResults.slice(0, 200), total, message: total > 200 ? "Chỉ hiển thị 200 kết quả đầu tiên." : "" };
};

module.exports = {
    getNumbersByMode,
    formatDate,
    getDefaultStartDate,
    getCurrentDate,
    isValidDate,
    findConsecutivePairs,
    findConsecutiveNumbers,
    findAlternatingNumbers,
    findAlternatingNumberPairs,
    findParityHeadTailSequences,
    findConsecutiveDoubleNumbers,
    findConsecutiveOffsetDoubleNumbers,
    findEvenHeadsGreaterThan4,
    findEvenHeadsLessThan4,
    findEvenTailsGreaterThan4,
    findEvenTailsLessThan4,
    findOddHeadsGreaterThan5,
    findOddHeadsLessThan5,
    findOddTailsGreaterThan5,
    findOddTailsLessThan5,
    findHeadAndTailStats,
    findConsecutiveSum,
    findSumGreaterThan5Consecutive6Days,
    findSumLessThan5Consecutive6Days,
    findSumEqualTo5Consecutive3Days,
    findIncreasingNumbers,
    findDecreasingNumbers,
    findConsecutiveIncreasingNumbers,
    findConsecutiveDecreasingNumbers,
    findParitySequenceNumbers,
    findNumbersInRange,
    findNewSumSolePairs,
    findHeadTailSizeSequences,
    findDifferenceSequences,
    getLatestDate,
    getEarliestDate,
    findLongestConsecutiveRun,
    analyzeCurrentStreaks,
    calculateAbsenceStreaks,
    analyzeNextDayOccurrences
};