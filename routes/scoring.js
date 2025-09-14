const express = require('express');
const router = express.Router();

// Route cho trang hiển thị kết quả tính điểm
router.get('/', (req, res) => {
    try {
        // Lấy các tham số từ query string
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const mode = req.query.mode || 'de';
        const patternType = req.query.patternType || 'all'; // Có thể là 'all' hoặc dạng cụ thể
        const patternSubtype = req.query.patternSubtype || 'all'; // Có thể là 'all' hoặc dạng con cụ thể
        const baseScore = parseInt(req.query.baseScore) || 90; // Mốc điểm mặc định là 90
        
        // Lấy dữ liệu xổ số từ biến toàn cục
        const lotteryData = req.lotteryData;
        
        // Kiểm tra dữ liệu
        if (!lotteryData || !Array.isArray(lotteryData) || lotteryData.length === 0) {
            return res.status(400).json({ error: 'Dữ liệu xổ số không hợp lệ hoặc không có sẵn.' });
        }
        
        // Lọc dữ liệu theo ngày
        let filteredData = lotteryData;
        if (startDate) {
            filteredData = filteredData.filter(item => new Date(item.date) >= new Date(startDate));
        }
        if (endDate) {
            filteredData = filteredData.filter(item => new Date(item.date) <= new Date(endDate));
        }

        // Lấy các số và thống kê số lần xuất hiện của mỗi dạng
        const numberCounts = {};
        
        // Duyệt qua từng ngày trong dữ liệu đã lọc
        filteredData.forEach(dayData => {
            if (!dayData) return; // Bỏ qua nếu không có dữ liệu
            
            const date = dayData.date;
            if (!date) return; // Bỏ qua nếu không có ngày
            
            try {
                const numbers = getNumbersByMode(dayData, mode);
                if (!numbers || numbers.length === 0) return; // Bỏ qua nếu không có số
                
                // Duyệt qua từng số
                numbers.forEach(number => {
                    if (!number) return; // Bỏ qua nếu không có số
                    
                    // Lấy các dạng của số này
                    const patterns = getPatterns(number);
                    
                    // Kiểm tra xem số có thuộc dạng đang tìm kiếm không
                    if (patterns[patternType] || patternType === 'all') {
                        const patternTypes = patternType === 'all' ? Object.keys(patterns) : [patternType];
                        
                        patternTypes.forEach(type => {
                            const subtypes = patterns[type];
                            
                            // Kiểm tra từng dạng con
                            subtypes.forEach(subtype => {
                                if (patternSubtype === 'all' || patternSubtype === subtype) {
                                    const key = `${type}_${subtype}`;
                                    
                                    if (!numberCounts[key]) {
                                        numberCounts[key] = {
                                            type: type,
                                            subtype: subtype,
                                            count: 0,
                                            numbers: []
                                        };
                                    }
                                    
                                    numberCounts[key].count++;
                                    numberCounts[key].numbers.push({
                                        date: date,
                                        number: number
                                    });
                                }
                            });
                        });
                    }
                });
            } catch (error) {
                console.error('Lỗi khi xử lý dữ liệu ngày:', date, error);
                // Bỏ qua ngày này và tiếp tục
            }
        });
        
        // Tính điểm cho mỗi dạng
        const results = [];
        
        Object.keys(numberCounts).forEach(key => {
            const type = numberCounts[key].type;
            const subtype = numberCounts[key].subtype;
            const count = numberCounts[key].count;
            const numbers = numberCounts[key].numbers;
            
            // Lấy hệ số nhân theo dạng con
            const multiplier = getMultiplier(type, subtype);
            
            // Tính điểm dựa trên công thức: Mốc điểm - (Số lần xuất hiện * Hệ số nhân)
            const score = baseScore - (count * multiplier);
            
            // Thêm kết quả vào mảng
            numbers.forEach(numberData => {
                results.push({
                    date: formatDate(numberData.date),
                    number: numberData.number,
                    patternType: getPatternName(type),
                    patternSubtype: getSubtypeName(subtype),
                    score: score
                });
            });
        });
        
        // Sắp xếp kết quả theo ngày giảm dần (mới nhất lên đầu)
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Trả về kết quả dưới dạng JSON
        res.json(results);
    } catch (error) {
        console.error('Lỗi khi tính điểm:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi tính điểm.' });
    }
});

// Hàm lấy các số dựa trên chế độ đã chọn
function getNumbersByMode(dayData, mode) {
    if (!dayData) return [];
    
    try {
        if (mode === 'de') {
            // Giải đặc biệt (2 số cuối)
            if (!dayData.specialPrize) return [];
            return [dayData.specialPrize.substring(dayData.specialPrize.length - 2)];
        } else if (mode === 'lo') {
            // Lô (tất cả các giải, 2 số cuối)
            const allNumbers = [];
            
            // Thêm giải đặc biệt
            if (dayData.specialPrize) {
                allNumbers.push(dayData.specialPrize.substring(dayData.specialPrize.length - 2));
            }
            
            // Thêm giải nhất
            if (dayData.firstPrize) {
                allNumbers.push(dayData.firstPrize.substring(dayData.firstPrize.length - 2));
            }
            
            // Thêm giải nhì
            if (dayData.secondPrize && Array.isArray(dayData.secondPrize)) {
                dayData.secondPrize.forEach(prize => {
                    if (prize) {
                        allNumbers.push(prize.substring(prize.length - 2));
                    }
                });
            }
            
            // Thêm giải ba
            if (dayData.thirdPrize && Array.isArray(dayData.thirdPrize)) {
                dayData.thirdPrize.forEach(prize => {
                    if (prize) {
                        allNumbers.push(prize.substring(prize.length - 2));
                    }
                });
            }
            
            // Thêm giải tư
            if (dayData.fourthPrize && Array.isArray(dayData.fourthPrize)) {
                dayData.fourthPrize.forEach(prize => {
                    if (prize) {
                        allNumbers.push(prize.substring(prize.length - 2));
                    }
                });
            }
            
            // Thêm giải năm
            if (dayData.fifthPrize && Array.isArray(dayData.fifthPrize)) {
                dayData.fifthPrize.forEach(prize => {
                    if (prize) {
                        allNumbers.push(prize.substring(prize.length - 2));
                    }
                });
            }
            
            // Thêm giải sáu
            if (dayData.sixthPrize && Array.isArray(dayData.sixthPrize)) {
                dayData.sixthPrize.forEach(prize => {
                    if (prize) {
                        allNumbers.push(prize.substring(prize.length - 2));
                    }
                });
            }
            
            // Thêm giải bảy
            if (dayData.seventhPrize && Array.isArray(dayData.seventhPrize)) {
                dayData.seventhPrize.forEach(prize => {
                    if (prize) {
                        allNumbers.push(prize.substring(prize.length - 2));
                    }
                });
            }
            
            return allNumbers;
        } else if (mode === 'prize1') {
            // Giải nhất
            if (!dayData.firstPrize) return [];
            return [dayData.firstPrize.substring(dayData.firstPrize.length - 2)];
        } else if (mode === 'prize2') {
            // Giải nhì
            if (!dayData.secondPrize || !Array.isArray(dayData.secondPrize)) return [];
            return dayData.secondPrize
                .filter(prize => prize) // Lọc bỏ các giá trị null/undefined
                .map(prize => prize.substring(prize.length - 2));
        } else if (mode === 'prize3') {
            // Giải ba
            if (!dayData.thirdPrize || !Array.isArray(dayData.thirdPrize)) return [];
            return dayData.thirdPrize
                .filter(prize => prize)
                .map(prize => prize.substring(prize.length - 2));
        } else if (mode === 'prize4') {
            // Giải tư
            if (!dayData.fourthPrize || !Array.isArray(dayData.fourthPrize)) return [];
            return dayData.fourthPrize
                .filter(prize => prize)
                .map(prize => prize.substring(prize.length - 2));
        } else if (mode === 'prize5') {
            // Giải năm
            if (!dayData.fifthPrize || !Array.isArray(dayData.fifthPrize)) return [];
            return dayData.fifthPrize
                .filter(prize => prize)
                .map(prize => prize.substring(prize.length - 2));
        } else if (mode === 'prize6') {
            // Giải sáu
            if (!dayData.sixthPrize || !Array.isArray(dayData.sixthPrize)) return [];
            return dayData.sixthPrize
                .filter(prize => prize)
                .map(prize => prize.substring(prize.length - 2));
        } else if (mode === 'prize7') {
            // Giải bảy
            if (!dayData.seventhPrize || !Array.isArray(dayData.seventhPrize)) return [];
            return dayData.seventhPrize
                .filter(prize => prize)
                .map(prize => prize.substring(prize.length - 2));
        } else if (mode.startsWith('pos')) {
            // Vị trí cụ thể
            const positionNumber = parseInt(mode.substring(3));
            const position = getPositionNumber(dayData, positionNumber);
            return position ? [position] : [];
        }
    } catch (error) {
        console.error('Lỗi trong getNumbersByMode:', error);
        return [];
    }
    
    return [];
}

// Hàm lấy số tại vị trí cụ thể
function getPositionNumber(dayData, position) {
    if (!dayData) return '';
    
    try {
        // Danh sách tất cả các số theo thứ tự vị trí
        const positionNumbers = [];
        
        // Vị trí 1: Giải nhất
        if (dayData.firstPrize) {
            positionNumbers.push(dayData.firstPrize.substring(dayData.firstPrize.length - 2));
        }
        
        // Vị trí 2-3: Giải nhì (2 giải)
        if (dayData.secondPrize && Array.isArray(dayData.secondPrize)) {
            dayData.secondPrize.forEach(prize => {
                if (prize) {
                    positionNumbers.push(prize.substring(prize.length - 2));
                }
            });
        }
        
        // Vị trí 4-9: Giải ba (6 giải)
        if (dayData.thirdPrize && Array.isArray(dayData.thirdPrize)) {
            dayData.thirdPrize.forEach(prize => {
                if (prize) {
                    positionNumbers.push(prize.substring(prize.length - 2));
                }
            });
        }
        
        // Vị trí 10-13: Giải tư (4 giải)
        if (dayData.fourthPrize && Array.isArray(dayData.fourthPrize)) {
            dayData.fourthPrize.forEach(prize => {
                if (prize) {
                    positionNumbers.push(prize.substring(prize.length - 2));
                }
            });
        }
        
        // Vị trí 14-19: Giải năm (6 giải)
        if (dayData.fifthPrize && Array.isArray(dayData.fifthPrize)) {
            dayData.fifthPrize.forEach(prize => {
                if (prize) {
                    positionNumbers.push(prize.substring(prize.length - 2));
                }
            });
        }
        
        // Vị trí 20-22: Giải sáu (3 giải)
        if (dayData.sixthPrize && Array.isArray(dayData.sixthPrize)) {
            dayData.sixthPrize.forEach(prize => {
                if (prize) {
                    positionNumbers.push(prize.substring(prize.length - 2));
                }
            });
        }
        
        // Vị trí 23-26: Giải bảy (4 giải)
        if (dayData.seventhPrize && Array.isArray(dayData.seventhPrize)) {
            dayData.seventhPrize.forEach(prize => {
                if (prize) {
                    positionNumbers.push(prize.substring(prize.length - 2));
                }
            });
        }
        
        // Trả về số tại vị trí được chỉ định (nếu có)
        if (position >= 1 && position <= positionNumbers.length) {
            return positionNumbers[position - 1];
        }
    } catch (error) {
        console.error('Lỗi trong getPositionNumber:', error);
        return '';
    }
    
    return '';
}

// Hàm xác định các dạng cho một số
function getPatterns(number) {
    if (!number || number.length !== 2) {
        return {}; // Chỉ xử lý số có 2 chữ số
    }
    
    try {
        const head = parseInt(number[0]); // Đầu số
        const tail = parseInt(number[1]); // Đít số
        
        if (isNaN(head) || isNaN(tail)) {
            return {}; // Bỏ qua nếu không phải số
        }
        
        const patterns = {};
        
        // Kiểm tra dạng Chẵn chẵn (đầu chẵn đít chẵn)
        if (head % 2 === 0 && tail % 2 === 0) {
            patterns.even_even = ['all_even_even']; // Tất cả các số có đầu chẵn và đít chẵn
            
            // Thêm các dạng con cụ thể
            if (head > 4 && tail > 4) {
                patterns.even_even.push('even_head_gt4_even_tail_gt4');
            } else if (head < 4 && tail < 4) {
                patterns.even_even.push('even_head_lt4_even_tail_lt4');
            } else if (head < 4 && tail > 4) {
                patterns.even_even.push('even_head_lt4_even_tail_gt4');
            } else if (head > 4 && tail < 4) {
                patterns.even_even.push('even_head_gt4_even_tail_lt4');
            }
            
            // Các trường hợp đặc biệt
            if (head === 4 && tail > 4) {
                patterns.even_even.push('even_head_eq4_even_tail_gt4');
            } else if (tail === 4 && head < 4) {
                patterns.even_even.push('even_tail_eq4_even_head_lt4');
            } else if (tail === 4 && head > 4) {
                patterns.even_even.push('even_tail_eq4_even_head_gt4');
            } else if (head === 4 && tail === 4) {
                patterns.even_even.push('even_head_eq4_even_tail_eq4');
            }
        }
        
        // Ở đây có thể thêm các dạng khác trong tương lai
        
        return patterns;
    } catch (error) {
        console.error('Lỗi trong getPatterns:', error);
        return {};
    }
}

// Hàm lấy hệ số nhân dựa trên dạng và dạng con
function getMultiplier(type, subtype) {
    try {
        // Dạng Chẵn chẵn
        if (type === 'even_even') {
            const multipliers = {
                'all_even_even': 1, // Tất cả (hệ số nhân 1)
                'even_head_gt4_even_tail_gt4': 6.25, // Đầu chẵn > 4 Đít chẵn > 4 (hệ số nhân 6.25)
                'even_head_lt4_even_tail_lt4': 6.25, // Đầu chẵn < 4 Đít chẵn < 4 (hệ số nhân 6.25)
                'even_head_lt4_even_tail_gt4': 6.25, // Đầu chẵn < 4 Đít chẵn > 4 (hệ số nhân 6.25)
                'even_head_gt4_even_tail_lt4': 6.25, // Đầu chẵn > 4 Đít chẵn < 4 (hệ số nhân 6.25)
                'even_head_eq4_even_tail_gt4': 12.5, // Đầu chẵn = 4 Đít chẵn > 4 (hệ số nhân 12.5)
                'even_tail_eq4_even_head_lt4': 12.5, // Đít chẵn = 4 Đầu chẵn < 4 (hệ số nhân 12.5)
                'even_tail_eq4_even_head_gt4': 12.5, // Đít chẵn = 4 Đầu chẵn > 4 (hệ số nhân 12.5)
                'even_head_eq4_even_tail_eq4': 30 // Đầu chẵn = 4 Đít chẵn = 4 (hệ số nhân 30)
            };
            
            return multipliers[subtype] || 1; // Mặc định là 1 nếu không tìm thấy
        }
        
        // Các dạng khác sẽ được thêm vào đây trong tương lai
    } catch (error) {
        console.error('Lỗi trong getMultiplier:', error);
    }
    
    return 1; // Mặc định là 1 nếu không tìm thấy dạng hoặc dạng con
}

// Hàm lấy tên dạng hiển thị
function getPatternName(type) {
    const patternNames = {
        'even_even': 'Chẵn chẵn'
        // Các dạng khác sẽ được thêm vào đây trong tương lai
    };
    
    return patternNames[type] || type;
}

// Hàm lấy tên dạng con hiển thị
function getSubtypeName(subtype) {
    const subtypeNames = {
        // Dạng Chẵn chẵn
        'all_even_even': 'Tất cả',
        'even_head_gt4_even_tail_gt4': 'Đầu chẵn > 4 Đít chẵn > 4',
        'even_head_lt4_even_tail_lt4': 'Đầu chẵn < 4 Đít chẵn < 4',
        'even_head_lt4_even_tail_gt4': 'Đầu chẵn < 4 Đít chẵn > 4',
        'even_head_gt4_even_tail_lt4': 'Đầu chẵn > 4 Đít chẵn < 4',
        'even_head_eq4_even_tail_gt4': 'Đầu chẵn = 4 Đít chẵn > 4',
        'even_tail_eq4_even_head_lt4': 'Đít chẵn = 4 Đầu chẵn < 4',
        'even_tail_eq4_even_head_gt4': 'Đít chẵn = 4 Đầu chẵn > 4',
        'even_head_eq4_even_tail_eq4': 'Đầu chẵn = 4 Đít chẵn = 4'
        // Các dạng con khác sẽ được thêm vào đây trong tương lai
    };
    
    return subtypeNames[subtype] || subtype;
}

// Hàm định dạng ngày tháng
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Trả về nguyên bản nếu không phải ngày hợp lệ
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Lỗi khi định dạng ngày:', dateString, error);
        return dateString;
    }
}

module.exports = router;