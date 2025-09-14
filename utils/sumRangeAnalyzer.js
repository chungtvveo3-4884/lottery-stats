/**
 * Hàm thống kê chuỗi tổng theo các khoảng giá trị cụ thể
 * @param {Array} data - Dữ liệu xổ số
 * @param {string} startDate - Ngày bắt đầu
 * @param {string} endDate - Ngày kết thúc
 * @param {string} mode - Chế độ lấy số ('de', 'lo', 'prize1', v.v.)
 * @param {number} consecutiveDays - Số ngày liên tiếp
 * @param {string} sumRange - Khoảng tổng ('0-3', '4-6', '7-9', '10-12', '13-15', '16-18')
 * @returns {Object} Kết quả thống kê
 */
const findSpecificSumRangeSequences = (data, startDate, endDate, mode, consecutiveDays = 2, sumRange = '0-3') => {
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

        // Định nghĩa các khoảng giá trị cho tổng
        const sumRanges = {
            '0-3': { min: 0, max: 3 },
            '4-6': { min: 4, max: 6 },
            '7-9': { min: 7, max: 9 },
            '10-12': { min: 10, max: 12 },
            '13-15': { min: 13, max: 15 },
            '16-18': { min: 16, max: 18 }
        };

        // Xác thực khoảng tổng
        if (!sumRanges[sumRange]) {
            return { 
                results: [], 
                total: 0, 
                message: 'Khoảng tổng không hợp lệ. Vui lòng chọn một trong các khoảng: 0-3, 4-6, 7-9, 10-12, 13-15, 16-18.'
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

        // Hàm tính tổng (luôn dùng kiểu mới - tổng đầy đủ từ 0-18)
        const calculateSum = (num) => {
            if (num === null || num === undefined || isNaN(num)) return null;
            num = Number(num) % 100; // Đảm bảo 2 chữ số
            
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head + tail; // Luôn trả về tổng đầy đủ (0-18)
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
                
                // Tìm các số có tổng thuộc khoảng cần tìm
                const matchingNumbers = numbers.filter(num => {
                    const sum = calculateSum(num);
                    return sum >= selectedRange.min && sum <= selectedRange.max;
                });
                
                if (matchingNumbers.length === 0) {
                    isValidSequence = false;
                    break;
                }
                
                // Lưu các số thỏa mãn và kết quả của ngày
                matchedNumbersPerDay.push(matchingNumbers);
                
                // Tính tổng cho mỗi số được tìm thấy
                const matchingSums = matchingNumbers.map(num => calculateSum(num));
                
                sequenceResults.push({
                    date: day.date,
                    numbers: numbers,
                    matched: matchingNumbers,
                    sums: matchingSums // Lưu các tổng tương ứng
                });
            }
            
            // Nếu tìm thấy chuỗi hợp lệ, thêm vào kết quả
            if (isValidSequence) {
                results.push({
                    range: sumRange,
                    minSum: selectedRange.min,
                    maxSum: selectedRange.max,
                    numbers: matchedNumbersPerDay,
                    results: sequenceResults,
                    dates: sequenceDays.map(day => day.date)
                });
            }
        }

        // Giới hạn kết quả và tạo thông báo
        const limitedResults = results.slice(0, 200); // Đã thay đổi giới hạn từ 500 xuống 200
        const total = results.length;
        let message = '';
        
        if (total === 0) {
            message = `Không tìm thấy chuỗi tổng ${sumRange} phù hợp`;
        } else {
            message = `Tìm thấy ${total} chuỗi tổng ${sumRange} liên tiếp ${consecutiveDays} ngày`;
            
            if (total > 200) { // Đã thay đổi số từ 500 xuống 200
                message += `. Chỉ hiển thị 200 kết quả đầu tiên`;
            }
        }

        return {
            results: limitedResults,
            total,
            message
        };
    } catch (error) {
        console.error('Lỗi trong findSpecificSumRangeSequences:', error);
        return { results: [], total: 0, message: 'Lỗi khi xử lý dữ liệu: ' + error.message };
    }
};

module.exports = {
    findSpecificSumRangeSequences
};