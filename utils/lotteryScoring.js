const lotteryService = require('../services/lotteryService');

// Định nghĩa các dạng số và hệ số nhân (CẬP NHẬT THEO YÊU CẦU)
const scoringForms = [
    {
        n: 'even-even',
        description: 'Dạng chẵn chẵn (đầu chẵn đít chẵn)',
        multiplier: 1.0,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && tail % 2 === 0;
        }
    },
    {
        n: '0101',
        description: 'Đầu chẵn lớn hơn 4 Đít chẵn lớn hơn 4',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head > 4 && tail % 2 === 0 && tail > 4;
        }
    },
    {
        n: '0000',
        description: 'Đầu chẵn bé hơn 4 Đít chẵn bé hơn 4',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head < 4 && tail % 2 === 0 && tail < 4;
        }
    },
    {
        n: '0001',
        description: 'Đầu chẵn bé hơn 4 Đít chẵn lớn hơn 4',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head < 4 && tail % 2 === 0 && tail > 4;
        }
    },
    {
        n: '0100',
        description: 'Đầu chẵn lớn hơn 4 Đít chẵn bé hơn 4',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head > 4 && tail % 2 === 0 && tail < 4;
        }
    },
    {
        n: '400',
        description: 'Đầu chẵn = 4 Đít chẵn bé hơn 4',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 4 && tail % 2 === 0 && tail < 4;
        }
    },
    {
        n: '401',
        description: 'Đầu chẵn = 4 Đít chẵn lớn hơn 4',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 4 && tail % 2 === 0 && tail > 4;
        }
    },
    {
        n: '004',
        description: 'Đít chẵn = 4 Đầu chẵn bé hơn 4',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return tail === 4 && head % 2 === 0 && head < 4;
        }
    },
    {
        n: '014',
        description: 'Đít chẵn = 4 Đầu chẵn lớn hơn 4',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return tail === 4 && head % 2 === 0 && head > 4;
        }
    },
    {
        n: '44',
        description: 'Đầu chẵn = 4, Đít chẵn = 4',
        multiplier: 30.0,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 4 && tail === 4;
        }
    },
    {
        n: 'even-odd',
        description: 'Dạng chẵn lẻ (đầu chẵn đít lẻ)',
        multiplier: 1.0,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && tail % 2 === 1;
        }
    },
    {
        n: '0111',
        description: 'Đầu chẵn lớn hơn 4 Đít lẻ lớn hơn 5',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head > 4 && tail % 2 === 1 && tail > 5;
        }
    },
    {
        n: '0010',
        description: 'Đầu chẵn bé hơn 4 Đít lẻ bé hơn 5',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head < 4 && tail % 2 === 1 && tail < 5;
        }
    },
    {
        n: '0011',
        description: 'Đầu chẵn bé hơn 4 Đít lẻ lớn hơn 5',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head < 4 && tail % 2 === 1 && tail > 5;
        }
    },
    {
        n: '0110',
        description: 'Đầu chẵn lớn hơn 4 Đít lẻ bé hơn 5',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head > 4 && tail % 2 === 1 && tail < 5;
        }
    },
    {
        n: '410',
        description: 'Đầu chẵn = 4 Đít lẻ bé hơn 5',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 4 && tail % 2 === 1 && tail < 5;
        }
    },
    {
        n: '411',
        description: 'Đầu chẵn = 4 Đít lẻ lớn hơn 5',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 4 && tail % 2 === 1 && tail > 5;
        }
    },
    {
        n: '015',
        description: 'Đầu chẵn > 4 Đít lẻ = 5',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head > 4 && tail === 5;
        }
    },
    {
        n: '005',
        description: 'Đầu chẵn < 4 Đít lẻ = 5',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 0 && head < 4 && tail === 5;
        }
    },
    {
        n: '45',
        description: 'Đầu chẵn = 4, Đít lẻ = 5',
        multiplier: 30.0,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 4 && tail === 5;
        }
    },
    {
        n: 'odd-odd',
        description: 'Dạng lẻ lẻ (đầu lẻ đít lẻ)',
        multiplier: 1.0,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && tail % 2 === 1;
        }
    },
    {
        n: '1111',
        description: 'Đầu lẻ lớn hơn 5 Đít lẻ lớn hơn 5',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head > 5 && tail % 2 === 1 && tail > 5;
        }
    },
    {
        n: '1010',
        description: 'Đầu lẻ bé hơn 5 Đít lẻ bé hơn 5',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head < 5 && tail % 2 === 1 && tail < 5;
        }
    },
    {
        n: '1011',
        description: 'Đầu lẻ bé hơn 5 Đít lẻ lớn hơn 5',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head < 5 && tail % 2 === 1 && tail > 5;
        }
    },
    {
        n: '1110',
        description: 'Đầu lẻ lớn hơn 5 Đít lẻ bé hơn 5',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head > 5 && tail % 2 === 1 && tail < 5;
        }
    },
    {
        n: '510',
        description: 'Đầu lẻ = 5 Đít lẻ bé hơn 5',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 5 && tail % 2 === 1 && tail < 5;
        }
    },
    {
        n: '511',
        description: 'Đầu lẻ = 5 Đít lẻ lớn hơn 5',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 5 && tail % 2 === 1 && tail > 5;
        }
    },
    {
        n: '105',
        description: 'Đít lẻ = 5 Đầu lẻ bé hơn 5',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return tail === 5 && head % 2 === 1 && head < 5;
        }
    },
    {
        n: '115',
        description: 'Đít lẻ = 5 Đầu lẻ lớn hơn 5',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return tail === 5 && head % 2 === 1 && head > 5;
        }
    },
    {
        n: '55',
        description: 'Đầu lẻ = 5, Đít lẻ = 5',
        multiplier: 30.0,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 5 && tail === 5;
        }
    },
    {
        n: 'odd-even',
        description: 'Dạng lẻ chẵn (đầu lẻ đít chẵn)',
        multiplier: 1.0,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && tail % 2 === 0;
        }
    },
    {
        n: '1101',
        description: 'Đầu lẻ lớn hơn 5 Đít chẵn lớn hơn 4',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head > 5 && tail % 2 === 0 && tail > 4;
        }
    },
    {
        n: '1000',
        description: 'Đầu lẻ bé hơn 5 Đít chẵn bé hơn 4',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head < 5 && tail % 2 === 0 && tail < 4;
        }
    },
    {
        n: '1001',
        description: 'Đầu lẻ bé hơn 5 Đít chẵn lớn hơn 4',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head < 5 && tail % 2 === 0 && tail > 4;
        }
    },
    {
        n: '1100',
        description: 'Đầu lẻ lớn hơn 5 Đít chẵn bé hơn 4',
        multiplier: 6.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head > 5 && tail % 2 === 0 && tail < 4;
        }
    },
    {
        n: '500',
        description: 'Đầu lẻ = 5 Đít chẵn bé hơn 4',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 5 && tail % 2 === 0 && tail < 4;
        }
    },
    {
        n: '501',
        description: 'Đầu lẻ = 5 Đít chẵn lớn hơn 4',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 5 && tail % 2 === 0 && tail > 4;
        }
    },
    {
        n: '114',
        description: 'Đầu lẻ lớn hơn 5 Đít chẵn = 4',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head > 5 && tail === 4;
        }
    },
    {
        n: '104',
        description: 'Đầu lẻ bé hơn 5 Đít chẵn = 4',
        multiplier: 12.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head % 2 === 1 && head < 5 && tail === 4;
        }
    },
    {
        n: '54',
        description: 'Đầu lẻ = 5, Đít chẵn = 4',
        multiplier: 30.0,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            const tail = num % 10;
            return head === 5 && tail === 4;
        }
    },
    // Individual head/tail categories - CẬP NHẬT HỆ SỐ NHÂN
    {
        n: 'head-even-gt4',
        description: 'Đầu chẵn lớn hơn 4',
        multiplier: 1.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            return head % 2 === 0 && head > 4;
        }
    },
    {
        n: 'tail-even-gt4',
        description: 'Đít chẵn lớn hơn 4',
        multiplier: 1.25,
        checkFunction: (num) => {
            const tail = num % 10;
            return tail % 2 === 0 && tail > 4;
        }
    },
    {
        n: 'head-even-lt4',
        description: 'Đầu chẵn bé hơn 4',
        multiplier: 1.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            return head % 2 === 0 && head < 4;
        }
    },
    {
        n: 'tail-even-lt4',
        description: 'Đít chẵn bé hơn 4',
        multiplier: 1.25,
        checkFunction: (num) => {
            const tail = num % 10;
            return tail % 2 === 0 && tail < 4;
        }
    },
    {
        n: 'head-4',
        description: 'Đầu chẵn = 4',
        multiplier: 2.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            return head === 4;
        }
    },
    {
        n: 'head-5',
        description: 'Đầu lẻ = 5',
        multiplier: 2.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            return head === 5;
        }
    },
    {
        n: 'head-odd-lt5',
        description: 'Đầu lẻ bé hơn 5',
        multiplier: 1.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            return head % 2 === 1 && head < 5;
        }
    },
    {
        n: 'tail-odd-lt5',
        description: 'Đít lẻ bé hơn 5',
        multiplier: 1.25,
        checkFunction: (num) => {
            const tail = num % 10;
            return tail % 2 === 1 && tail < 5;
        }
    },
    {
        n: 'head-odd-gt5',
        description: 'Đầu lẻ lớn hơn 5',
        multiplier: 1.25,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            return head % 2 === 1 && head > 5;
        }
    },
    {
        n: 'tail-odd-gt5',
        description: 'Đít lẻ lớn hơn 5',
        multiplier: 1.25,
        checkFunction: (num) => {
            const tail = num % 10;
            return tail % 2 === 1 && tail > 5;
        }
    },
    {
        n: 'tail-4',
        description: 'Đít chẵn = 4',
        multiplier: 1.25,
        checkFunction: (num) => {
            const tail = num % 10;
            return tail === 4;
        }
    },
    {
        n: 'tail-5',
        description: 'Đít lẻ = 5',
        multiplier: 1.25,
        checkFunction: (num) => {
            const tail = num % 10;
            return tail === 5;
        }
    }
];

// Add individual head forms (0-9) - CẬP NHẬT HỆ SỐ NHÂN
for (let i = 0; i < 10; i++) {
    scoringForms.push({
        n: `head-${i}`,
        description: `Đầu ${i}`,
        multiplier: 2.5,
        checkFunction: (num) => {
            const head = Math.floor(num / 10);
            return head === i;
        }
    });
}

// Add individual tail forms (0-9) - CẬP NHẬT HỆ SỐ NHÂN
for (let i = 0; i < 10; i++) {
    scoringForms.push({
        n: `tail-${i}`,
        description: `Đít ${i}`,
        multiplier: 2.5,
        checkFunction: (num) => {
            const tail = num % 10;
            return tail === i;
        }
    });
}

// Add individual number forms (00-99) - CẬP NHẬT HỆ SỐ NHÂN
for (let i = 0; i < 100; i++) {
    const numStr = String(i).padStart(2, '0');
    scoringForms.push({
        n: numStr,
        description: `Số ${numStr}`,
        multiplier: 15.0,
        checkFunction: (num) => {
            return (num % 100) === i;
        }
    });
}

// Helper function to format date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Main scoring calculation function
const calculateLotteryScores = (data, startDate, endDate, mode, formFilter = null) => {
    try {
        if (!Array.isArray(data)) {
            return { results: [], total: 0, message: 'Dữ liệu không hợp lệ.' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start) || isNaN(end) || start > end) {
            return { results: [], total: 0, message: 'Ngày không hợp lệ.' };
        }

        // Filter data by date range
        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= start && entryDate <= end;
        });

        if (filteredData.length === 0) {
            return { results: [], total: 0, message: 'Không có dữ liệu trong khoảng thời gian đã chọn.' };
        }

        const results = [];
        const formsToProcess = formFilter ? 
            scoringForms.filter(form => form.n === formFilter) : 
            scoringForms;

        for (const form of formsToProcess) {
            const formResult = {
                form: form.description,
                dates: [],
                dateToNumbers: {},
                occurrences: 0,
                multiplier: form.multiplier,
                score: 0
            };

            // Process each day
            filteredData.forEach(entry => {
                const numbers = lotteryService.getNumbersByMode(entry, mode);
                const matchingNumbers = numbers.filter(num => {
                    const normalizedNum = Number(num) % 100;
                    return form.checkFunction(normalizedNum);
                });

                if (matchingNumbers.length > 0) {
                    formResult.dates.push(formatDate(entry.date));
                    formResult.dateToNumbers[formatDate(entry.date)] = matchingNumbers.map(num => 
                        String(Number(num) % 100).padStart(2, '0')
                    );
                    formResult.occurrences++;
                }
            });

            // Calculate score - ALLOW NEGATIVE VALUES
            formResult.score = 90 - (formResult.occurrences * form.multiplier);
            
            // Only include forms that have occurrences or if showing all
            if (formResult.occurrences > 0 || !formFilter) {
                results.push(formResult);
            }
        }

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        const total = results.length;
        const message = total === 0 ? 'Không tìm thấy kết quả phù hợp.' : '';

        return { results, total, message };
    } catch (error) {
        console.error('Lỗi trong calculateLotteryScores:', error);
        return { results: [], total: 0, message: 'Lỗi khi tính điểm: ' + error.message };
    }
};

// Calculate all lottery scores
const calculateAllLotteryScores = (data, startDate, endDate, mode) => {
    try {
        if (!Array.isArray(data)) {
            return { results: [], total: 0, message: 'Dữ liệu không hợp lệ.' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start) || isNaN(end) || start > end) {
            return { results: [], total: 0, message: 'Ngày không hợp lệ.' };
        }

        // Filter data by date range
        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= start && entryDate <= end;
        });

        if (filteredData.length === 0) {
            return { results: [], total: 0, message: 'Không có dữ liệu trong khoảng thời gian đã chọn.' };
        }

        const results = [];

        for (const form of scoringForms) {
            const formResult = {
                form: form.description,
                dates: [],
                dateToNumbers: {},
                occurrences: 0,
                multiplier: form.multiplier,
                score: 0
            };

            // Process each day
            filteredData.forEach(entry => {
                const numbers = lotteryService.getNumbersByMode(entry, mode);
                const matchingNumbers = numbers.filter(num => {
                    const normalizedNum = Number(num) % 100;
                    return form.checkFunction(normalizedNum);
                });

                if (matchingNumbers.length > 0) {
                    formResult.dates.push(formatDate(entry.date));
                    formResult.dateToNumbers[formatDate(entry.date)] = matchingNumbers.map(num => 
                        String(Number(num) % 100).padStart(2, '0')
                    );
                    formResult.occurrences++;
                }
            });

            // Calculate score - ALLOW NEGATIVE VALUES
            formResult.score = 90 - (formResult.occurrences * form.multiplier);
            
            results.push(formResult);
        }

        // Sort by score descending (negative scores will be at the bottom)
        results.sort((a, b) => b.score - a.score);

        const total = results.length;
        const message = total === 0 ? 'Không tìm thấy kết quả.' : `Tính toán hoàn tất cho ${total} dạng số.`;

        return { results, total, message };
    } catch (error) {
        console.error('Lỗi trong calculateAllLotteryScores:', error);
        return { results: [], total: 0, message: 'Lỗi khi tính điểm: ' + error.message };
    }
};

// Helper functions for enhanced functionality
const findFormsByOccurrence = (data, startDate, endDate, mode, targetOccurrence) => {
    const allResults = calculateAllLotteryScores(data, startDate, endDate, mode);
    return allResults.results.filter(result => result.occurrences === targetOccurrence);
};

const findFormsByTypes = (data, startDate, endDate, mode, formTypes) => {
    let results = [];
    
    for (const formType of formTypes) {
        const formResults = calculateLotteryScores(data, startDate, endDate, mode, formType);
        results = results.concat(formResults.results);
    }
    
    return results;
};

const analyzeDuplicates = (results) => {
    const numberToForms = {};
    const duplicateAnalysis = {
        duplicateNumbers: {},
        totalDuplicates: 0,
        formsWithDuplicates: new Set()
    };
    
    // Build map of numbers to forms
    results.forEach(result => {
        if (result.dateToNumbers) {
            Object.values(result.dateToNumbers).forEach(numbers => {
                numbers.forEach(number => {
                    if (!numberToForms[number]) {
                        numberToForms[number] = new Set();
                    }
                    numberToForms[number].add(result.form);
                });
            });
        }
    });
    
    // Find duplicates
    Object.keys(numberToForms).forEach(number => {
        const forms = Array.from(numberToForms[number]);
        if (forms.length > 1) {
            duplicateAnalysis.duplicateNumbers[number] = forms;
            duplicateAnalysis.totalDuplicates++;
            forms.forEach(form => duplicateAnalysis.formsWithDuplicates.add(form));
        }
    });
    
    return duplicateAnalysis;
};

const getOccurrenceStatistics = (data, startDate, endDate, mode) => {
    const allResults = calculateAllLotteryScores(data, startDate, endDate, mode);
    const occurrenceMap = {};
    
    allResults.results.forEach(result => {
        const occurrence = result.occurrences;
        if (!occurrenceMap[occurrence]) {
            occurrenceMap[occurrence] = [];
        }
        occurrenceMap[occurrence].push(result);
    });
    
    return {
        byOccurrence: occurrenceMap,
        totalForms: allResults.results.length,
        occurrenceRange: {
            min: Math.min(...Object.keys(occurrenceMap).map(Number)),
            max: Math.max(...Object.keys(occurrenceMap).map(Number))
        }
    };
};

const calculateAllLotteryScoresWithDuplicates = (data, startDate, endDate, mode) => {
    const baseResults = calculateAllLotteryScores(data, startDate, endDate, mode);
    const duplicateAnalysis = analyzeDuplicates(baseResults.results);
    
    return {
        ...baseResults,
        duplicates: duplicateAnalysis.duplicateNumbers,
        duplicateStats: {
            totalDuplicateNumbers: duplicateAnalysis.totalDuplicates,
            formsWithDuplicates: Array.from(duplicateAnalysis.formsWithDuplicates),
            duplicatePercentage: (duplicateAnalysis.totalDuplicates / baseResults.results.length * 100).toFixed(2)
        }
    };
};

const analyzeScoreDistribution = (results) => {
    const distribution = {
        positive: results.filter(r => r.score > 0),
        zero: results.filter(r => r.score === 0),
        negative: results.filter(r => r.score < 0),
        statistics: {
            max: Math.max(...results.map(r => r.score)),
            min: Math.min(...results.map(r => r.score)),
            average: results.reduce((sum, r) => sum + r.score, 0) / results.length,
            median: getMedian(results.map(r => r.score).sort((a, b) => a - b))
        }
    };
    
    return distribution;
};

const getMedian = (sortedArray) => {
    const mid = Math.floor(sortedArray.length / 2);
    return sortedArray.length % 2 !== 0 
        ? sortedArray[mid] 
        : (sortedArray[mid - 1] + sortedArray[mid]) / 2;
};

const interpretScore = (score, occurrences) => {
    if (score < 0) {
        return {
            level: 'negative',
            description: 'Xuất hiện quá nhiều lần',
            recommendation: 'Có thể sẽ ít xuất hiện trong thời gian tới',
            color: 'danger'
        };
    } else if (score === 0) {
        return {
            level: 'neutral',
            description: 'Xuất hiện đúng mức kỳ vọng',
            recommendation: 'Tần suất xuất hiện bình thường',
            color: 'warning'
        };
    } else if (score >= 85) {
        return {
            level: 'excellent',
            description: 'Xuất hiện rất ít',
            recommendation: 'Có thể có cơ hội xuất hiện cao',
            color: 'success'
        };
    } else if (score >= 70) {
        return {
            level: 'good',
            description: 'Xuất hiện ít',
            recommendation: 'Có cơ hội xuất hiện tốt',
            color: 'info'
        };
    } else {
        return {
            level: 'average',
            description: 'Xuất hiện bình thường',
            recommendation: 'Tần suất xuất hiện trung bình',
            color: 'secondary'
        };
    }
};

const formatScore = (score) => {
    if (score < 0) {
        return `<span style="color: red; font-weight: bold;">${score}</span>`;
    } else if (score === 0) {
        return `<span style="color: orange; font-weight: bold;">${score}</span>`;
    } else {
        return `<span style="color: green; font-weight: bold;">${score}</span>`;
    }
};

const getScoringStatistics = (results) => {
    const stats = {
        totalForms: results.length,
        positiveScores: results.filter(r => r.score > 0).length,
        zeroScores: results.filter(r => r.score === 0).length,
        negativeScores: results.filter(r => r.score < 0).length,
        maxScore: Math.max(...results.map(r => r.score)),
        minScore: Math.min(...results.map(r => r.score)),
        averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
    };

    return stats;
};

// HÀM TÍNH ĐIỂM TỔNG HỢP - PHIÊN BẢN HOÀN THIỆN VỚI PHÂN LOẠI ĐỘNG
const calculateAggregateScoreForAllNumbers = (data, startDate, endDate, mode) => {
    try {
        if (!Array.isArray(data)) {
            return { results: [], message: 'Dữ liệu không hợp lệ.' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start) || isNaN(end) || start > end) {
            return { results: [], message: 'Ngày không hợp lệ.' };
        }

        const filteredData = data.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= start && entryDate <= end;
        });

        if (filteredData.length === 0) {
            return { results: [], message: 'Không có dữ liệu trong khoảng thời gian đã chọn.' };
        }
        
        const allNumbersScores = [];

        const formOccurrenceCache = new Map();
        for (const form of scoringForms) {
            let occurrences = 0;
            filteredData.forEach(entry => {
                const numbers = lotteryService.getNumbersByMode(entry, mode);
                const matchingNumbers = numbers.filter(num => form.checkFunction(Number(num) % 100));
                if (matchingNumbers.length > 0) {
                    occurrences++;
                }
            });
            formOccurrenceCache.set(form.n, occurrences);
        }

        for (let i = 0; i < 100; i++) {
            const currentNumber = i;
            let totalScore = 0;
            const contributingForms = [];

            for (const form of scoringForms) {
                if (form.checkFunction(currentNumber)) {
                    const occurrences = formOccurrenceCache.get(form.n);
                    const individualScore = 90 - (occurrences * form.multiplier);
                    totalScore += individualScore;
                    contributingForms.push({
                        formName: form.description,
                        formN: form.n,
                        occurrences: occurrences,
                        multiplier: form.multiplier,
                        score: individualScore,
                    });
                }
            }

            // === BƯỚC 3 MỚI: PHÂN LOẠI TRẠNG THÁI DỰA TRÊN TỶ LỆ % ===

            // 3.1. Tính điểm tối đa lý thuyết
            const maxPossibleScore = contributingForms.length * 90;

            // 3.2. Tính tỷ lệ điểm (để tránh chia cho 0)
            const scoreRatio = (maxPossibleScore > 0) ? (totalScore / maxPossibleScore) : 0;
            
            // 3.3. Phân loại dựa trên tỷ lệ %
            let status = '';
            let statusClass = '';
            
            if (scoreRatio >= 0.8) { // >= 80%
                status = 'Khá';
                statusClass = 'bg-success';
            } else if (scoreRatio >= 0.6) { // 60% - 80%
                status = 'Trung Bình';
                statusClass = 'bg-info';
            } else if (scoreRatio >= 0.4) { // 40% - 60%
                status = 'Cân Bằng';
                statusClass = 'bg-secondary';
            } else if (scoreRatio >= 0.2) { // 20% - 40%
                status = 'Kém';
                statusClass = 'bg-warning text-dark';
            } else { // < 25%
                status = 'Rất Kém';
                statusClass = 'bg-danger';
            }
            allNumbersScores.push({
                number: String(currentNumber).padStart(2, '0'),
                totalScore: Math.round(totalScore * 10) / 10,
                status: status,
                statusClass: statusClass,
                // Thêm scoreRatio để có thể hiển thị nếu muốn
                scoreRatio: (scoreRatio * 100).toFixed(1) + '%', 
                contributingForms: contributingForms.sort((a, b) => b.score - a.score),
            });
        }
        
        allNumbersScores.sort((a, b) => b.totalScore - a.totalScore);

        return { results: allNumbersScores, message: 'Tính điểm tổng hợp thành công.' };

    } catch (error) {
        console.error('Lỗi trong calculateAggregateScoreForAllNumbers:', error);
        return { results: [], message: 'Lỗi server khi tính điểm tổng hợp: ' + error.message };
    }
};

module.exports = {
    calculateLotteryScores,
    calculateAllLotteryScores,
    findFormsByOccurrence,
    findFormsByTypes,
    analyzeDuplicates,
    getOccurrenceStatistics,
    calculateAllLotteryScoresWithDuplicates,
    analyzeScoreDistribution,
    interpretScore,
    formatScore,
    getScoringStatistics,
    scoringForms,
    calculateAggregateScoreForAllNumbers 
};