/**
 * Hàm thống kê chuỗi tổng truyền thống theo các khoảng giá trị cụ thể
 * @param {Array} data - Dữ liệu xổ số
 * @param {string} startDate - Ngày bắt đầu
 * @param {string} endDate - Ngày kết thúc
 * @param {string} mode - Chế độ lấy số ('de', 'lo', 'prize1', v.v.)
 * @param {number} consecutiveDays - Số ngày liên tiếp
 * @param {string} sumRange - Khoảng tổng ('1-2', '3-4', '5-6', '7-8', '9-10')
 * @returns {Object} Kết quả thống kê
 */
const findTraditionalSumRangeSequences = (data, startDate, endDate, mode, consecutiveDays = 2, sumRange = '1-2') => {
    // Import các hàm cần thiết từ lotteryService
    const { getNumbersByMode } = require('../services/lotteryService');
    
    try {
        // Kiểm tra đầu vào
        if (!Array.isArray(data)) {
            console.error('Invalid data: data is not an array');
            return { results: [], total: 0, message: 'Dữ liệu không hợp lệ.' };
        }

        if (consecutiveDays < 2 || consecutiveDays > 20) {
            consecutiveDays = Math.max(2, Math.min(consecutiveDays, 20));
        }

        // Định nghĩa các khoảng giá trị cho tổng truyền thống
        const sumRanges = {
            '1-2': { min: 1, max: 2, name: "Tổng < 3" },
            '3-4': { min: 3, max: 4, name: "Tổng > 2 < 6" },
            '5-6': { min: 5, max: 6, name: "Tổng > 4 < 7" },
            '7-8': { min: 7, max: 8, name: "Tổng > 6 < 9" },
            '9-10': { min: 9, max: 10, name: "Tổng > 8" }
        };

        // Xác thực khoảng tổng
        if (!sumRanges[sumRange]) {
            return { 
                results: [], 
                total: 0, 
                message: 'Khoảng tổng không hợp lệ. Vui lòng chọn một trong các khoảng: 1-2, 3-4, 5-6, 7-8, 9-10.'
            };
        }

        const selectedRange = sumRanges[sumRange];

        // Lọc và sắp xếp dữ liệu theo ngày
        const filteredData = data
            .filter(item => {
                if (!item || !item.date) return false;
                const itemDate = new Date(item.date);
                return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (filteredData.length < consecutiveDays) {
            return { 
                results: [], 
                total: 0, 
                message: 'Không đủ dữ liệu cho số ngày liên tiếp yêu cầu.' 
            };
        }

        // Hàm tính tổng theo kiểu truyền thống (từ 1-10)
        const calculateTraditionalSum = (num) => {
            if (num === null || num === undefined || isNaN(num)) return null;
            num = Number(num) % 100; // Đảm bảo 2 chữ số
            
            const head = Math.floor(num / 10);
            const tail = num % 10;
            const rawSum = head + tail;
            
            // Kiểu truyền thống: lấy phần đơn vị, 0 đặc biệt thành 10
            if (num === 0) return 10;
            return rawSum % 10 === 0 ? 10 : rawSum % 10;
        };

        const results = [];

        // Duyệt qua từng chuỗi ngày có thể có
        for (let i = 0; i <= filteredData.length - consecutiveDays; i++) {
            const sequenceDays = filteredData.slice(i, i + consecutiveDays);
            const sequenceResults = [];
            const matchedNumbersPerDay = [];
            let isValidSequence = true;
            
            // Kiểm tra từng ngày trong chuỗi
            for (let j = 0; j < consecutiveDays; j++) {
                const day = sequenceDays[j];
                const numbers = getNumbersByMode(day, mode);
                
                if (!numbers || numbers.length === 0) {
                    isValidSequence = false;
                    break;
                }
                
                // Tìm các số có tổng thuộc khoảng cần tìm (theo kiểu truyền thống)
                const matchingNumbers = numbers.filter(num => {
                    const sum = calculateTraditionalSum(num);
                    return sum >= selectedRange.min && sum <= selectedRange.max;
                });
                
                if (matchingNumbers.length === 0) {
                    isValidSequence = false;
                    break;
                }
                
                // Lưu các số thỏa mãn và kết quả của ngày
                matchedNumbersPerDay.push(matchingNumbers);
                
                // Tính tổng cho mỗi số được tìm thấy (kiểu truyền thống)
                const matchingSums = matchingNumbers.map(num => calculateTraditionalSum(num));
                
                sequenceResults.push({
                    date: day.date,
                    numbers: numbers,
                    matched: matchingNumbers,
                    sums: matchingSums
                });
            }
            
            // Nếu tìm thấy chuỗi hợp lệ, thêm vào kết quả
            if (isValidSequence) {
                results.push({
                    range: sumRange,
                    rangeName: selectedRange.name,
                    minSum: selectedRange.min,
                    maxSum: selectedRange.max,
                    numbers: matchedNumbersPerDay,
                    results: sequenceResults,
                    dates: sequenceDays.map(day => day.date)
                });
            }
        }

        // Giới hạn kết quả và tạo thông báo
        const limitedResults = results.slice(0, 200);
        const total = results.length;
        let message = '';
        
        if (total === 0) {
            message = `Không tìm thấy chuỗi tổng ${selectedRange.name} phù hợp`;
        } else {
            message = `Tìm thấy ${total} chuỗi ${selectedRange.name} liên tiếp ${consecutiveDays} ngày`;
            
            if (total > 200) {
                message += `. Chỉ hiển thị 200 kết quả đầu tiên`;
            }
        }

        return {
            results: limitedResults,
            total,
            message,
            rangeName: selectedRange.name
        };
    } catch (error) {
        console.error('Lỗi trong findTraditionalSumRangeSequences:', error);
        return { results: [], total: 0, message: 'Lỗi khi xử lý dữ liệu: ' + error.message };
    }
};

module.exports = {
    findTraditionalSumRangeSequences
};