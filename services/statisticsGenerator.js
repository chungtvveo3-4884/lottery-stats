const fs = require('fs').promises;
const path = require('path');
const { SETS, MAPS, findNextInSet, findPreviousInSet } = require('../utils/numberAnalysis');

const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
const OUTPUT_FILE_PATH = path.join(__dirname, '..', 'data', 'statistics', 'number_stats.json');

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
            cacSoTienLienTiep: findProgressiveStreaks(lotteryData, dateToIndexMap, false, SETS.ALL, MAPS.ALL),
            cacSoTienDeuLienTiep: findProgressiveStreaks(lotteryData, dateToIndexMap, true, SETS.ALL, MAPS.ALL),
            cacSoLuiLienTiep: findRegressiveStreaks(lotteryData, dateToIndexMap, false, SETS.ALL, MAPS.ALL),
            cacSoLuiDeuLienTiep: findRegressiveStreaks(lotteryData, dateToIndexMap, true, SETS.ALL, MAPS.ALL),
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

function findConsecutiveStreaks(data, dateMap) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];
        if (currentItem.value === nextItem.value) {
            if (currentStreak.length === 0) currentStreak.push(currentItem);
            currentStreak.push(nextItem);
        } else {
            if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            currentStreak = [];
        }
    }
    if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    return { description: "1 số về liên tiếp", streaks: allStreaks.filter(Boolean) };
}

function findConsecutiveTypeStreaks(data, dateMap, allowedMap) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length; i++) {
        const currentItem = data[i];
        if (allowedMap.has(currentItem.value)) {
            currentStreak.push(currentItem);
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
        const currentItem = data[i];
        if (data[i + 2] && currentItem.value === data[i + 2].value) {
            let streak = [currentItem, data[i + 2]];
            let lastIndex = i + 2;
            while (data[lastIndex + 2] && data[lastIndex].value === data[lastIndex + 2].value) {
                streak.push(data[lastIndex + 2]);
                lastIndex += 2;
            }
            if (streak.length >= 3) {
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
        const currentItem = data[i];
        if (allowedMap.has(currentItem.value) && data[i+2] && allowedMap.has(data[i+2].value)) {
            let streak = [currentItem, data[i + 2]];
            let lastIndex = i + 2;
             while (data[lastIndex + 2] && allowedMap.has(data[lastIndex].value) && allowedMap.has(data[lastIndex + 2].value)) {
                streak.push(data[lastIndex + 2]);
                lastIndex += 2;
            }
            if (streak.length >= 3) {
                 allStreaks.push(createStreakObject(data, dateMap, streak, { value: "Theo dạng" }));
                 i = lastIndex -1;
            }
        }
    }
    return { streaks: allStreaks.filter(Boolean) };
}

function findProgressiveStreaks(data, dateMap, isUniform, numberSet, numberMap) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];
        if (numberMap.has(currentItem.value) && numberMap.has(nextItem.value)) {
            const val1 = currentItem.value;
            const val2 = nextItem.value;
            const condition = isUniform ? (findNextInSet(val1, numberSet, numberMap) === val2) : (parseInt(val2, 10) > parseInt(val1, 10));
            if (condition) {
                if (currentStreak.length === 0) currentStreak.push(currentItem);
                currentStreak.push(nextItem);
            } else {
                if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
                currentStreak = [];
            }
        } else {
            if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            currentStreak = [];
        }
    }
    if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    const desc = `Các số ${isUniform ? 'tiến ĐỀU' : 'tiến'} liên tiếp`;
    return { description: desc, streaks: allStreaks.filter(Boolean) };
}

function findRegressiveStreaks(data, dateMap, isUniform, numberSet, numberMap) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];
        if (numberMap.has(currentItem.value) && numberMap.has(nextItem.value)) {
            const val1 = currentItem.value;
            const val2 = nextItem.value;
            const condition = isUniform ? (findPreviousInSet(val1, numberSet, numberMap) === val2) : (parseInt(val2, 10) < parseInt(val1, 10));
            if (condition) {
                if (currentStreak.length === 0) currentStreak.push(currentItem);
                currentStreak.push(nextItem);
            } else {
                if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
                currentStreak = [];
            }
        } else {
            if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            currentStreak = [];
        }
    }
    if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    const desc = `Các số ${isUniform ? 'lùi ĐỀU' : 'lùi'} liên tiếp`;
    return { description: desc, streaks: allStreaks.filter(Boolean) };
}

function findAlternatingPairStreaks(data, dateMap) {
    const allStreaks = [];
    let i = 0;
    while (i < data.length - 3) {
        const a = data[i].value;
        const b = data[i + 1].value;
        const a2 = data[i + 2].value;
        const b2 = data[i + 3].value;
        if (a === a2 && b === b2 && a !== b) {
            let streak = [data[i], data[i + 1], data[i + 2], data[i + 3]];
            let j = i + 2;
            while (j < data.length - 3 && data[j].value === data[j + 2]?.value && data[j + 1]?.value === data[j + 3]?.value) {
                streak.push(data[j + 2], data[j + 3]);
                j += 2;
            }
            allStreaks.push(createStreakObject(data, dateMap, streak, { pair: [a, b] }));
            i = j;
        } else {
            i++;
        }
    }
    return { description: "Cặp số về so le", streaks: allStreaks.filter(Boolean) };
}

function analyzeParityStreaks(data, dateMap, setKey, typeName) {
    const numberSet = SETS[setKey];
    const numberMap = MAPS[setKey];
    return {
        veLienTiep: { ...findConsecutiveTypeStreaks(data, dateMap, numberMap), description: `Số dạng ${typeName} về liên tiếp`},
        veSole: { ...findAlternatingTypeStreaks(data, dateMap, numberMap), description: `Số dạng ${typeName} về so le` },
        tienLienTiep: { ...findProgressiveStreaks(data, dateMap, false, numberSet, numberMap), description: `Số dạng ${typeName} tiến liên tiếp` },
        tienDeuLienTiep: { ...findProgressiveStreaks(data, dateMap, true, numberSet, numberMap), description: `Số dạng ${typeName} tiến ĐỀU liên tiếp` },
        luiLienTiep: { ...findRegressiveStreaks(data, dateMap, false, numberSet, numberMap), description: `Số dạng ${typeName} lùi liên tiếp` },
        luiDeuLienTiep: { ...findRegressiveStreaks(data, dateMap, true, numberSet, numberMap), description: `Số dạng ${typeName} lùi ĐỀU liên tiếp` },
    };
}

// Để chạy độc lập:
generateNumberStats();

module.exports = generateNumberStats;

