const fs = require('fs');
const path = require('path');
const lotteryService = require('../services/lotteryService');
const { analyzeNumbers } = require('../utils/numberPatterns');

const simulationFilePath = path.join(__dirname, '../data/simulation.json');

// Hàm đọc dữ liệu giả lập từ file
const readSimulationData = () => {
    try {
        if (fs.existsSync(simulationFilePath)) {
            const data = fs.readFileSync(simulationFilePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Lỗi khi đọc file simulation.json:', error);
        return [];
    }
};

// Hàm ghi dữ liệu giả lập vào file
const writeSimulationData = (data) => {
    try {
        const dataDir = path.dirname(simulationFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(simulationFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Lỗi khi ghi file simulation.json:', error);
        return false;
    }
};


// Helper function để lấy số từ kết quả xổ số
const getNumbersFromResult = (lotteryResult, mode) => {
    // Nếu có cấu trúc mới (trực tiếp)
    if (lotteryResult.special !== undefined) {
        if (mode === 'de') {
            // Đề - chỉ lấy 2 số cuối của giải đặc biệt
            const special = String(lotteryResult.special).padStart(2, '0');
            return [special.slice(-2)];
        } else if (mode === 'lo') {
            // Lô - lấy 2 số cuối của tất cả các giải
            const numbers = [];
            
            // Special
            if (lotteryResult.special !== undefined) {
                numbers.push(String(lotteryResult.special).padStart(2, '0').slice(-2));
            }
            
            // Other prizes
            const prizeKeys = Object.keys(lotteryResult).filter(key => key.startsWith('prize'));
            prizeKeys.forEach(key => {
                if (lotteryResult[key] !== undefined && lotteryResult[key] !== null) {
                    numbers.push(String(lotteryResult[key]).padStart(2, '0').slice(-2));
                }
            });
            
            return numbers;
        }
    }
    
    // Fallback to original method if structure is different
    return lotteryService.getNumbersByMode(lotteryResult, mode);
};

// Hàm tính toán Win/Lose với chi tiết
const calculateWinLose = (simulationEntry, lotteryResult) => {
    let totalWinLose = 0;
    const details = { danh: null, om: null };
    
    if (simulationEntry.danh && simulationEntry.danh.numbers && simulationEntry.danh.numbers.length > 0) {
        const danhAmount = simulationEntry.danh.amount || 0;
        const danhNumbers = simulationEntry.danh.numbers.map(n => String(n).padStart(2, '0'));
        const deResult = lotteryService.getNumbersByMode(lotteryResult, 'de').map(n => String(n).padStart(2, '0'));
        const matchingDanh = danhNumbers.filter(num => deResult.includes(num));
        const winAmount = matchingDanh.length * danhAmount * 70;
        const betAmount = danhNumbers.length * danhAmount * 0.8;
        const profit = winAmount - betAmount;
        
        // SỬA LỖI: Sử dụng đúng biến 'matchingDanh'
        details.danh = { profit, matchingNumbers: matchingDanh, winningNumbers: deResult };
        totalWinLose += profit;
    }
    
    if (simulationEntry.om && simulationEntry.om.numbers && simulationEntry.om.numbers.length > 0) {
        const omAmount = simulationEntry.om.amount || 0;
        const omNumbers = simulationEntry.om.numbers.map(n => String(n).padStart(2, '0'));
        const deResult = lotteryService.getNumbersByMode(lotteryResult, 'de').map(n => String(n).padStart(2, '0'));
        const matchingOm = omNumbers.filter(num => deResult.includes(num));
        const winAmount = omNumbers.length * omAmount * 0.705;
        const loseAmount = matchingOm.length * omAmount * 70;
        const profit = winAmount - loseAmount;
        
        // SỬA LỖI: Sử dụng đúng biến 'matchingOm'
        details.om = { profit, matchingNumbers: matchingOm, isWin: matchingOm.length === 0 };
        totalWinLose += profit;
    }
    
    return { totalWinLose: Math.round(totalWinLose), details };
};

// Helper function để parse date an toàn
const safeParseDate = (dateStr) => {
    try {
        if (!dateStr) return null;
        
        // Nếu có format ISO với T
        if (dateStr.includes('T')) {
            return new Date(dateStr);
        }
        
        // Nếu format YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
            const day = parseInt(parts[2]);
            return new Date(year, month, day);
        }
        
        // Try default parsing
        return new Date(dateStr);
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return null;
    }
};

// Hiển thị trang giả lập
const getSimulationPage = async (req, res) => {
    try {
        const data = req.lotteryData;
        if (!data || data.length === 0) return res.status(500).send('Lỗi: Không thể tải dữ liệu xổ số.');

        const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestResultDate = sortedData[0].date.split('T')[0];
        
        const latestDateObj = new Date(latestResultDate);
        latestDateObj.setDate(latestDateObj.getDate() + 1);
        const predictionDate = latestDateObj.toISOString().split('T')[0];

        const simulationHistory = readSimulationData();

        const processedHistory = simulationHistory.map(entry => {
            const entryDate = entry.date;
            const lotteryResult = data.find(d => d.date.startsWith(entryDate));
            
            if (lotteryResult) {
                const result = calculateWinLose(entry, lotteryResult);
                return { ...entry, hasResult: true, winLose: result.totalWinLose, resultDetails: result.details };
            }
            return { ...entry, hasResult: false, winLose: null, resultDetails: null };
        });

        res.render('simulation', {
            latestDate: latestResultDate,
            predictionDate: predictionDate,
            history: processedHistory.sort((a, b) => new Date(b.date) - new Date(a.date)),
            formatDate: lotteryService.formatDate
        });
    } catch (error) {
        console.error('Lỗi trong getSimulationPage:', error);
        res.status(500).send('Lỗi server khi xử lý yêu cầu.');
    }
};

// Xử lý submit giả lập
const submitSimulation = async (req, res) => {
    try {
        const data = req.lotteryData;
        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'Không thể tải dữ liệu xổ số.' });
        }

        // Kiểm tra req.body tồn tại
        if (!req.body) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
        }

        const { danhNumbers, danhAmount, omNumbers, omAmount } = req.body;

        // Validate input
        if ((!danhNumbers || danhNumbers.length === 0) && (!omNumbers || omNumbers.length === 0)) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một số để đánh hoặc ôm.' });
        }

        if ((danhNumbers && danhNumbers.length > 0 && (!danhAmount || danhAmount <= 0)) ||
            (omNumbers && omNumbers.length > 0 && (!omAmount || omAmount <= 0))) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập số tiền hợp lệ.' });
        }

        // Sắp xếp dữ liệu theo ngày giảm dần
        const sortedData = [...data].sort((a, b) => {
            const dateA = safeParseDate(a.date);
            const dateB = safeParseDate(b.date);
            if (!dateA || !dateB) return 0;
            return dateB - dateA;
        });
        
        // Lấy ngày mới nhất trong dữ liệu (đã có kết quả)
        const latestResultDate = sortedData[0].date;
        
        // Chuẩn hóa format ngày thành YYYY-MM-DD
        let normalizedLatestDate;
        if (latestResultDate.includes('T')) {
            normalizedLatestDate = latestResultDate.split('T')[0];
        } else {
            normalizedLatestDate = latestResultDate;
        }

        // Tính ngày dự đoán (ngày tiếp theo của ngày có kết quả mới nhất)
        const parts = normalizedLatestDate.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        
        const latestDate = new Date(year, month, day);
        latestDate.setDate(latestDate.getDate() + 1);
        
        const nextYear = latestDate.getFullYear();
        const nextMonth = String(latestDate.getMonth() + 1).padStart(2, '0');
        const nextDay = String(latestDate.getDate()).padStart(2, '0');
        
        const predictionDate = `${nextYear}-${nextMonth}-${nextDay}`;

        // Tạo entry mới với format thời gian an toàn
        const now = new Date();
        const submittedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}Z`;
        
        const newEntry = {
            id: Date.now().toString(),
            date: predictionDate,
            submittedAt: submittedAt,
            danh: danhNumbers && danhNumbers.length > 0 ? {
                numbers: danhNumbers,
                amount: parseInt(danhAmount)
            } : null,
            om: omNumbers && omNumbers.length > 0 ? {
                numbers: omNumbers,
                amount: parseInt(omAmount)
            } : null,
            status: 'pending',
            winLose: null
        };

        // Đọc dữ liệu hiện tại và thêm entry mới
        const simulationData = readSimulationData();
        simulationData.push(newEntry);

        // Ghi lại file
        const success = writeSimulationData(simulationData);
        if (success) {
            res.json({ success: true, message: 'Đã lưu thông tin giả lập thành công!' });
        } else {
            res.status(500).json({ success: false, message: 'Lỗi khi lưu dữ liệu.' });
        }
    } catch (error) {
        console.error('Lỗi trong submitSimulation:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xử lý yêu cầu.' });
    }
};

// Lấy thống kê cho giả lập
const getSimulationStats = async (req, res) => {
    try {
        const data = req.lotteryData;
        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'Không thể tải dữ liệu xổ số.' });
        }

        const { mode, consecutiveDays } = req.query;
        const days = parseInt(consecutiveDays) || 2;

        if (days < 2 || days > 10) {
            return res.status(400).json({ success: false, message: 'Số ngày phải từ 2 đến 10.' });
        }

        // Xử lý các dates trong getSimulationStats
        const sortedData = [...data].sort((a, b) => {
            const dateA = safeParseDate(a.date);
            const dateB = safeParseDate(b.date);
            if (!dateA || !dateB) return 0;
            return dateB - dateA;
        });
        const recentData = sortedData.slice(0, days);

        if (recentData.length < days) {
            return res.status(400).json({ success: false, message: 'Không đủ dữ liệu cho số ngày yêu cầu.' });
        }

        // Phân tích từng ngày riêng biệt
        const dailyAnalysis = [];
        const allNumbersFromPatterns = new Set(); // Tất cả số từ các dạng
        const numberAppearanceCount = new Map(); // Đếm số lần xuất hiện của mỗi số qua các ngày
        
        recentData.forEach(dayData => {
            // Lấy số của ngày này
            const dayNumbers = lotteryService.getNumbersByMode(dayData, mode);
            const uniqueDayNumbers = Array.from(new Set(dayNumbers.map(n => parseInt(n)))).sort((a, b) => a - b);
            
            // Phân tích các dạng của ngày này
            const patternAnalysis = analyzeNumbers(uniqueDayNumbers);
            
            // Thu thập TẤT CẢ các số từ TẤT CẢ các dạng của ngày này
            const dayPatternNumbers = new Set();
            const patternDetails = [];
            const numberToPatterns = new Map(); // Lưu số nào thuộc dạng nào
            
            patternAnalysis.patterns.forEach(pattern => {
                if (pattern.allNumbers && pattern.allNumbers.length > 0) {
                    const patternNumbers = pattern.allNumbers.map(num => String(num).padStart(2, '0'));
                    patternDetails.push({
                        name: pattern.name,
                        numbers: patternNumbers
                    });
                    
                    patternNumbers.forEach(num => {
                        dayPatternNumbers.add(num);
                        allNumbersFromPatterns.add(num);
                        
                        // Lưu pattern cho mỗi số
                        if (!numberToPatterns.has(num)) {
                            numberToPatterns.set(num, []);
                        }
                        numberToPatterns.get(num).push(pattern.name);
                    });
                }
            });
            
            // Đếm số lần xuất hiện của mỗi số
            dayPatternNumbers.forEach(num => {
                numberAppearanceCount.set(num, (numberAppearanceCount.get(num) || 0) + 1);
            });
            
            dailyAnalysis.push({
                date: dayData.date,
                originalNumbers: uniqueDayNumbers.map(n => String(n).padStart(2, '0')),
                patternNumbers: Array.from(dayPatternNumbers).sort(),
                patternCount: patternDetails.length,
                patterns: patternDetails,
                numberToPatterns: Object.fromEntries(numberToPatterns)
            });
        });

        // Phân loại số theo số lần xuất hiện
        const commonNumbers = []; // Số xuất hiện trong TẤT CẢ các ngày
        const partialNumbers = []; // Số xuất hiện trong một số ngày
        const uniqueNumbers = []; // Số chỉ xuất hiện trong 1 ngày
        
        numberAppearanceCount.forEach((count, number) => {
            const detail = {
                number: number,
                count: count,
                percentage: Math.round((count / days) * 100),
                days: dailyAnalysis
                    .filter(day => day.patternNumbers.includes(number))
                    .map(day => lotteryService.formatDate(day.date))
            };
            
            if (count === days) {
                commonNumbers.push(detail);
            } else if (count > 1) {
                partialNumbers.push(detail);
            } else {
                uniqueNumbers.push(detail);
            }
        });

        // Sắp xếp
        commonNumbers.sort((a, b) => a.number.localeCompare(b.number));
        partialNumbers.sort((a, b) => b.count - a.count || a.number.localeCompare(b.number));
        uniqueNumbers.sort((a, b) => a.number.localeCompare(b.number));

        res.json({
            success: true,
            data: {
                mode: mode,
                consecutiveDays: days,
                dateRange: {
                    from: lotteryService.formatDate(recentData[recentData.length - 1].date),
                    to: lotteryService.formatDate(recentData[0].date)
                },
                commonNumbers: commonNumbers,
                partialNumbers: partialNumbers,
                uniqueNumbers: uniqueNumbers,
                totalNumbers: allNumbersFromPatterns.size,
                dailyAnalysis: dailyAnalysis.map(day => ({
                    date: lotteryService.formatDate(day.date),
                    originalCount: day.originalNumbers.length,
                    originalNumbers: day.originalNumbers,
                    patternNumbersCount: day.patternNumbers.length,
                    patternNumbers: day.patternNumbers,
                    patternCount: day.patternCount,
                    patterns: day.patterns,
                    numberToPatterns: day.numberToPatterns
                }))
            }
        });
    } catch (error) {
        console.error('Lỗi trong getSimulationStats:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xử lý yêu cầu.' });
    }
};

// *** HÀM MỚI ĐỂ XỬ LÝ SỬA GIẢ LẬP ***
const editSimulation = async (req, res) => {
    try {
        const { id } = req.params;
        const { danhNumbers, danhAmount, omNumbers, omAmount } = req.body;
        
        const simulationData = readSimulationData();
        const entryIndex = simulationData.findIndex(entry => entry.id === id);

        if (entryIndex === -1) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giả lập để sửa.' });
        }

        const lotteryData = req.lotteryData;
        const entryDate = simulationData[entryIndex].date;
        const hasResult = lotteryData.some(d => d.date.startsWith(entryDate));

        if (hasResult) {
            return res.status(403).json({ success: false, message: 'Không thể sửa giả lập đã có kết quả.' });
        }

        simulationData[entryIndex].danh = (danhNumbers && danhNumbers.length > 0) ? { numbers: danhNumbers.map(Number), amount: parseInt(danhAmount) } : null;
        simulationData[entryIndex].om = (omNumbers && omNumbers.length > 0) ? { numbers: omNumbers.map(Number), amount: parseInt(omAmount) } : null;
        simulationData[entryIndex].submittedAt = new Date().toISOString();

        if (writeSimulationData(simulationData)) {
            res.json({ success: true, message: 'Đã cập nhật giả lập thành công!' });
        } else {
            res.status(500).json({ success: false, message: 'Lỗi khi lưu dữ liệu.' });
        }

    } catch (error) {
        console.error('Lỗi trong editSimulation:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xử lý yêu cầu.' });
    }
};


// *** SỬA LỖI: THÊM editSimulation VÀO EXPORTS ***
module.exports = {
    getSimulationPage,
    submitSimulation,
    getSimulationStats,
    editSimulation 
};