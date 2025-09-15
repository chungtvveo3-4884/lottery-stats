const fs = require('fs').promises;
const path = require('path');
const { SETS, MAPS, INDEX_MAPS, findNextInSet, findPreviousInSet } = require('../utils/numberAnalysis');

const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
const OUTPUT_FILE_PATH = path.join(__dirname, '..', 'data', 'statistics', 'number_stats.json');

// --- HÀM TIỆN ÍCH VỀ NGÀY THÁNG ---

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
}

/**
 * Kiểm tra xem hai ngày có liên tiếp nhau không.
 * @param {string} dateStr1 - Chuỗi ngày thứ nhất (dd/mm/yyyy).
 * @param {string} dateStr2 - Chuỗi ngày thứ hai (dd/mm/yyyy).
 * @returns {boolean} - True nếu ngày 2 là ngay sau ngày 1.
 */
function isConsecutive(dateStr1, dateStr2) {
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return d2.getTime() - d1.getTime() === oneDay;
}


// --- HÀM TẠO ĐỐI TƯỢNG CHUỖI ---

function createStreakObject(data, dateMap, streak, typeSpecificData = {}) {
    if (!streak || streak.length === 0) return null;
    const firstItem = streak[0];
    const lastItem = streak[streak.length - 1];
    const startIndex = dateMap.get(firstItem.date);
    const endIndex = dateMap.get(lastItem.date);
    if (startIndex === undefined || endIndex === undefined) return null;
    const fullSequence = data.slice(startIndex, endIndex + 1);
    return {
        startDate: firstItem.date,
        endDate: lastItem.date,
        length: fullSequence.length,
        values: streak.map(item => item.value),
        dates: streak.map(item => item.date),
        fullSequence,
        ...typeSpecificData
    };
}


// --- CÁC HÀM TÌM CHUỖI (ĐÃ SỬA LOGIC) ---

function findConsecutiveStreaks(data, dateMap) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];
        
        // Bắt đầu chuỗi nếu chưa có
        if (currentStreak.length === 0) {
            currentStreak.push(currentItem);
        }

        // Nếu giá trị giống nhau VÀ ngày liên tiếp -> kéo dài chuỗi
        if (currentItem.value === nextItem.value && isConsecutive(currentItem.date, nextItem.date)) {
            currentStreak.push(nextItem);
        } else { // Nếu không -> kết thúc chuỗi hiện tại
            if (currentStreak.length > 1) {
                allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            }
            currentStreak = []; // Bắt đầu lại từ đầu ở vòng lặp sau
        }
    }
    if (currentStreak.length > 1) {
        allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    }
    return { description: "1 số về liên tiếp", streaks: allStreaks.filter(Boolean) };
}

function findConsecutiveTypeStreaks(data, dateMap, allowedMap) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];

        if (allowedMap.has(currentItem.value)) {
            if (currentStreak.length === 0) {
                currentStreak.push(currentItem);
            }
            if (allowedMap.has(nextItem.value) && isConsecutive(currentItem.date, nextItem.date)) {
                currentStreak.push(nextItem);
            } else {
                if (currentStreak.length > 1) {
                    allStreaks.push(createStreakObject(data, dateMap, currentStreak));
                }
                currentStreak = [];
            }
        } else {
            if (currentStreak.length > 1) {
                allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            }
            currentStreak = [];
        }
    }
    if (currentStreak.length > 1) {
        allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    }
    return { streaks: allStreaks.filter(Boolean) };
}

function findAlternatingStreaks(data, dateMap) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 2; i++) {
        // Điều kiện so le: cách 1 ngày và ngày đó phải tồn tại
        if (data[i + 1] && isConsecutive(data[i].date, data[i+1].date) && isConsecutive(data[i+1].date, data[i+2].date) && data[i].value === data[i + 2].value) {
            let streak = [data[i], data[i + 2]];
            let lastIndex = i + 2;
            while (data[lastIndex + 2] && isConsecutive(data[lastIndex+1].date, data[lastIndex+2].date) && data[lastIndex].value === data[lastIndex + 2].value) {
                streak.push(data[lastIndex + 2]);
                lastIndex += 2;
            }
            if (streak.length >= 2) { // Một cặp so le đã là 1 chuỗi
                 allStreaks.push(createStreakObject(data, dateMap, streak, { value: streak[0].value }));
                 i = lastIndex -1; 
            }
        }
    }
    return { description: "1 số về so le", streaks: allStreaks.filter(Boolean) };
}

function findAlternatingTypeStreaks(data, dateMap, allowedMap) {
    const allStreaks = [];
     for (let i = 0; i < data.length - 2; i++) {
        if (allowedMap.has(data[i].value) && 
            allowedMap.has(data[i+2].value) && 
            isConsecutive(data[i].date, data[i+1].date) && 
            isConsecutive(data[i+1].date, data[i+2].date)) 
        {
            let streak = [data[i], data[i + 2]];
            let lastIndex = i + 2;
             while (data[lastIndex + 2] && 
                    allowedMap.has(data[lastIndex].value) && 
                    allowedMap.has(data[lastIndex + 2].value) && 
                    isConsecutive(data[lastIndex+1].date, data[lastIndex+2].date)) {
                streak.push(data[lastIndex + 2]);
                lastIndex += 2;
            }
            if (streak.length >= 2) {
                 allStreaks.push(createStreakObject(data, dateMap, streak, { value: "Theo dạng" }));
                 i = lastIndex -1;
            }
        }
    }
    return { streaks: allStreaks.filter(Boolean) };
}

function findProgressiveStreaks(data, dateMap, isUniform, numberSet, indexMap) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];

        if (currentStreak.length === 0) {
            currentStreak.push(currentItem);
        }

        const condition = isUniform 
            ? (findNextInSet(currentItem.value, numberSet, indexMap) === nextItem.value) 
            : (parseInt(nextItem.value, 10) > parseInt(currentItem.value, 10));

        if (condition && isConsecutive(currentItem.date, nextItem.date) && MAPS.ALL.has(currentItem.value) && MAPS.ALL.has(nextItem.value)) {
            currentStreak.push(nextItem);
        } else {
            if (currentStreak.length > 1) {
                allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            }
            currentStreak = [nextItem]; // Bắt đầu chuỗi mới với item hiện tại
        }
    }
    if (currentStreak.length > 1) {
        allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    }
    const desc = `Các số ${isUniform ? 'tiến ĐỀU' : 'tiến'} liên tiếp`;
    return { description: desc, streaks: allStreaks.filter(Boolean) };
}

function findRegressiveStreaks(data, dateMap, isUniform, numberSet, indexMap) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];
        
        if (currentStreak.length === 0) {
            currentStreak.push(currentItem);
        }

        const condition = isUniform 
            ? (findPreviousInSet(currentItem.value, numberSet, indexMap) === nextItem.value) 
            : (parseInt(nextItem.value, 10) < parseInt(currentItem.value, 10));

        if (condition && isConsecutive(currentItem.date, nextItem.date) && MAPS.ALL.has(currentItem.value) && MAPS.ALL.has(nextItem.value)) {
            currentStreak.push(nextItem);
        } else {
            if (currentStreak.length > 1) {
                allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            }
            currentStreak = [nextItem];
        }
    }
    if (currentStreak.length > 1) {
        allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    }
    const desc = `Các số ${isUniform ? 'lùi ĐỀU' : 'lùi'} liên tiếp`;
    return { description: desc, streaks: allStreaks.filter(Boolean) };
}

function findAlternatingPairStreaks(data, dateMap) {
    const allStreaks = [];
    let i = 0;
    while (i < data.length - 3) {
        if (isConsecutive(data[i].date, data[i+1].date) && 
            isConsecutive(data[i+1].date, data[i+2].date) && 
            isConsecutive(data[i+2].date, data[i+3].date)) 
        {
            const a = data[i].value;
            const b = data[i + 1].value;
            if (a === data[i + 2].value && b === data[i + 3].value && a !== b) {
                let streak = [data[i], data[i + 1], data[i + 2], data[i + 3]];
                let j = i + 2;
                while (j < data.length - 3 && 
                       isConsecutive(data[j+1].date, data[j+2].date) &&
                       isConsecutive(data[j+2].date, data[j+3].date) &&
                       data[j].value === data[j + 2].value && 
                       data[j + 1].value === data[j + 3].value) {
                    streak.push(data[j + 2], data[j + 3]);
                    j += 2;
                }
                allStreaks.push(createStreakObject(data, dateMap, streak, { pair: [a, b] }));
                i = j;
            } else {
                i++;
            }
        } else {
            i++;
        }
    }
    return { description: "Cặp số về so le", streaks: allStreaks.filter(Boolean) };
}


// --- HÀM PHÂN TÍCH CHÍNH ---

function analyzeParityStreaks(data, dateMap, setKey, typeName) {
    const numberSet = SETS[setKey];
    const numberMap = MAPS[setKey];
    const indexMap = INDEX_MAPS[setKey];
    return {
        veLienTiep: { ...findConsecutiveTypeStreaks(data, dateMap, numberMap), description: `Số dạng ${typeName} về liên tiếp`},
        veSole: { ...findAlternatingTypeStreaks(data, dateMap, numberMap), description: `Số dạng ${typeName} về so le` },
        tienLienTiep: { ...findProgressiveStreaks(data, dateMap, false, numberSet, indexMap), description: `Số dạng ${typeName} tiến liên tiếp` },
        tienDeuLienTiep: { ...findProgressiveStreaks(data, dateMap, true, numberSet, indexMap), description: `Số dạng ${typeName} tiến ĐỀU liên tiếp` },
        luiLienTiep: { ...findRegressiveStreaks(data, dateMap, false, numberSet, indexMap), description: `Số dạng ${typeName} lùi liên tiếp` },
        luiDeuLienTiep: { ...findRegressiveStreaks(data, dateMap, true, numberSet, indexMap), description: `Số dạng ${typeName} lùi ĐỀU liên tiếp` },
    };
}

async function generateNumberStats() {
    try {
        await fs.mkdir(path.dirname(OUTPUT_FILE_PATH), { recursive: true });
        const rawData = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        const originalData = JSON.parse(rawData);

        const lotteryData = originalData
            .map(item => (item.special === null || typeof item.special !== 'number' || isNaN(item.special)) ? null : {
                date: formatDate(item.date),
                value: String(item.special).padStart(2, '0')
            })
            .filter(item => item !== null)
            .sort((a, b) => parseDate(a.date) - parseDate(b.date));
            
        const dateToIndexMap = new Map(lotteryData.map((item, index) => [item.date, index]));

        console.log(`Đã xử lý và chuẩn hóa ${lotteryData.length} kết quả hợp lệ.`);
        console.log('Bắt đầu tính toán thống kê cho các dạng số...');

        const stats = {
            motSoVeLienTiep: findConsecutiveStreaks(lotteryData, dateToIndexMap),
            motSoVeSole: findAlternatingStreaks(lotteryData, dateToIndexMap),
            cacSoTienLienTiep: findProgressiveStreaks(lotteryData, dateToIndexMap, false, SETS.ALL, INDEX_MAPS.ALL),
            cacSoTienDeuLienTiep: findProgressiveStreaks(lotteryData, dateToIndexMap, true, SETS.ALL, INDEX_MAPS.ALL),
            cacSoLuiLienTiep: findRegressiveStreaks(lotteryData, dateToIndexMap, false, SETS.ALL, INDEX_MAPS.ALL),
            cacSoLuiDeuLienTiep: findRegressiveStreaks(lotteryData, dateToIndexMap, true, SETS.ALL, INDEX_MAPS.ALL),
            capSoVeSoLe: findAlternatingPairStreaks(lotteryData, dateToIndexMap),
            chanChan: analyzeParityStreaks(lotteryData, dateToIndexMap, 'CHAN_CHAN', 'Chẵn-Chẵn'),
            chanLe: analyzeParityStreaks(lotteryData, dateToIndexMap, 'CHAN_LE', 'Chẵn-Lẻ'),
            leChan: analyzeParityStreaks(lotteryData, dateToIndexMap, 'LE_CHAN', 'Lẻ-Chẵn'),
            leLe: analyzeParityStreaks(lotteryData, dateToIndexMap, 'LE_LE', 'Lẻ-Lẻ'),
        };

        await fs.writeFile(OUTPUT_FILE_PATH, JSON.stringify(stats, null, 2));
        console.log(`✅ Đã lưu kết quả thống kê số vào: ${OUTPUT_FILE_PATH}`);

    } catch (error) {
        console.error("❌ Lỗi khi tạo file thống kê số:", error);
    }
}

// Để chạy độc lập:
generateNumberStats();

module.exports = generateNumberStats;