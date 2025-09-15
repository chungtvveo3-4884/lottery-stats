const fs = require('fs').promises;
const path = require('path');
const { SETS, MAPS, DIGITS, DIGIT_MAPS, findNextInSet, findPreviousInSet } = require('../utils/numberAnalysis');

const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
const OUTPUT_FILE_PATH = path.join(__dirname, '..', 'data', 'statistics', 'head_tail_stats.json');

// --- Hàm tiện ích ---
const getHead = (item) => item.value[0];
const getTail = (item) => item.value[1];

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

// --- Các hàm tính toán chuỗi chung ---

function findGenericStreaks(data, dateMap, condition, description) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];
        if (condition(currentItem, nextItem)) {
            if (currentStreak.length === 0) currentStreak.push(currentItem);
            currentStreak.push(nextItem);
        } else {
            if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            currentStreak = [];
        }
    }
    if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    return { description, streaks: allStreaks.filter(Boolean) };
}

function findGenericAlternatingStreaks(data, dateMap, condition, description) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 2; i++) {
        const streak = [data[i]];
        let lastMatchIndex = i;
        
        while(data[lastMatchIndex + 2] && condition(data[lastMatchIndex], data[lastMatchIndex + 2])) {
             if (streak.indexOf(data[lastMatchIndex + 2]) === -1) {
                streak.push(data[lastMatchIndex + 2]);
             }
             lastMatchIndex += 2;
        }

        if (lastMatchIndex - i >= 2) { 
             const fullStreakData = data.slice(i, lastMatchIndex + 1);
             const validItems = fullStreakData.filter((_, index) => index % 2 === 0);
             const streakObject = createStreakObject(data, dateMap, validItems, { value: "Theo dạng" });
             if (streakObject) {
                allStreaks.push(streakObject);
             }
             i = lastMatchIndex -1; 
        }
    }
    return { description, streaks: allStreaks.filter(Boolean) };
}

function findGenericProgressiveStreaks(data, dateMap, isUniform, valueExtractor, digitSet, digitMap, description) {
    const allStreaks = [];
    let currentStreak = [];
    for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];
        const val1 = valueExtractor(currentItem);
        const val2 = valueExtractor(nextItem);

        if (val1 === null || val2 === null) {
            if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            currentStreak = [];
            continue;
        }

        const condition = isUniform 
            ? findNextInSet(val1, digitSet, digitMap) === val2
            : parseInt(val2, 10) > parseInt(val1, 10);
        
        if (condition) {
            if (currentStreak.length === 0) currentStreak.push(currentItem);
            currentStreak.push(nextItem);
        } else {
            if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            currentStreak = [];
        }
    }
    if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    return { description, streaks: allStreaks.filter(Boolean) };
}

function findGenericRegressiveStreaks(data, dateMap, isUniform, valueExtractor, digitSet, digitMap, description) {
    const allStreaks = [];
    let currentStreak = [];
     for (let i = 0; i < data.length - 1; i++) {
        const currentItem = data[i];
        const nextItem = data[i + 1];
        const val1 = valueExtractor(currentItem);
        const val2 = valueExtractor(nextItem);

         if (val1 === null || val2 === null) {
            if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            currentStreak = [];
            continue;
        }

        const condition = isUniform 
            ? findPreviousInSet(val1, digitSet, digitMap) === val2
            : parseInt(val2, 10) < parseInt(val1, 10);
        
        if (condition) {
            if (currentStreak.length === 0) currentStreak.push(currentItem);
            currentStreak.push(nextItem);
        } else {
            if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            currentStreak = [];
        }
    }
    if (currentStreak.length > 1) allStreaks.push(createStreakObject(data, dateMap, currentStreak));
    return { description, streaks: allStreaks.filter(Boolean) };
}


function analyzeGenericType(data, dateMap, typeName, descriptionPrefix, valueExtractor = (item) => item.value) {
    const numberSet = SETS[typeName];
    const numberMap = MAPS[typeName];

    const filteredDataForConsecutive = data.filter(item => numberMap.has(item.value));
    const filteredDataForAlternating = data.map(item => ({...item, isValid: numberMap.has(item.value)}));
    
    return {
        veLienTiep: findGenericStreaks(filteredDataForConsecutive, dateMap, (a, b) => true, `${descriptionPrefix} về liên tiếp`),
        veSole: findGenericAlternatingStreaks(filteredDataForAlternating, dateMap, (a, b) => a.isValid && b.isValid, `${descriptionPrefix} về so le`),
        tienLienTiep: findGenericProgressiveStreaks(data, dateMap, false, valueExtractor, numberSet, null, `${descriptionPrefix} tiến liên tiếp`),
        tienDeuLienTiep: findGenericProgressiveStreaks(data, dateMap, true, valueExtractor, numberSet, numberMap, `${descriptionPrefix} tiến ĐỀU liên tiếp`),
        luiLienTiep: findGenericRegressiveStreaks(data, dateMap, false, valueExtractor, numberSet, null, `${descriptionPrefix} lùi liên tiếp`),
        luiDeuLienTiep: findGenericRegressiveStreaks(data, dateMap, true, valueExtractor, numberSet, numberMap, `${descriptionPrefix} lùi ĐỀU liên tiếp`),
    };
}


async function generateHeadTailStats() {
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
        console.log('Bắt đầu tính toán thống kê cho Đầu và Đít...');

        const stats = {
            // --- Đầu ---
            motDauVeLienTiep: findGenericStreaks(lotteryData, dateToIndexMap, (a, b) => getHead(a) === getHead(b), "1 Đầu về liên tiếp"),
            motDauVeSole: findGenericAlternatingStreaks(lotteryData, dateToIndexMap, (a, b) => getHead(a) === getHead(b), "1 Đầu về so le"),
            cacDauTien: findGenericProgressiveStreaks(lotteryData, dateToIndexMap, false, getHead, DIGITS, null, "Các Đầu tiến liên tiếp"),
            cacDauTienDeu: findGenericProgressiveStreaks(lotteryData, dateToIndexMap, true, getHead, DIGITS, DIGIT_MAPS.DIGITS, "Các Đầu tiến ĐỀU liên tiếp"),
            cacDauLui: findGenericRegressiveStreaks(lotteryData, dateToIndexMap, false, getHead, DIGITS, null, "Các Đầu lùi liên tiếp"),
            cacDauLuiDeu: findGenericRegressiveStreaks(lotteryData, dateToIndexMap, true, getHead, DIGITS, DIGIT_MAPS.DIGITS, "Các Đầu lùi ĐỀU liên tiếp"),

            // --- Đít ---
            motDitVeLienTiep: findGenericStreaks(lotteryData, dateToIndexMap, (a, b) => getTail(a) === getTail(b), "1 Đít về liên tiếp"),
            motDitVeSole: findGenericAlternatingStreaks(lotteryData, dateToIndexMap, (a, b) => getTail(a) === getTail(b), "1 Đít về so le"),
            cacDitTien: findGenericProgressiveStreaks(lotteryData, dateToIndexMap, false, getTail, DIGITS, null, "Các Đít tiến liên tiếp"),
            cacDitTienDeu: findGenericProgressiveStreaks(lotteryData, dateToIndexMap, true, getTail, DIGITS, DIGIT_MAPS.DIGITS, "Các Đít tiến ĐỀU liên tiếp"),
            cacDitLui: findGenericRegressiveStreaks(lotteryData, dateToIndexMap, false, getTail, DIGITS, null, "Các Đít lùi liên tiếp"),
            cacDitLuiDeu: findGenericRegressiveStreaks(lotteryData, dateToIndexMap, true, getTail, DIGITS, DIGIT_MAPS.DIGITS, "Các Đít lùi ĐỀU liên tiếp"),
            
            // --- Các dạng phức hợp ---
            dauChan: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN', 'Đầu chẵn', getHead),
            dauLe: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE', 'Đầu lẻ', getHead),
            ditChan: analyzeGenericType(lotteryData, dateToIndexMap, 'DIT_CHAN', 'Đít chẵn', getTail),
            ditLe: analyzeGenericType(lotteryData, dateToIndexMap, 'DIT_LE', 'Đít lẻ', getTail),
            dauToDitTo: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_TO_DIT_TO', 'Đầu to - Đít to'),
            dauToDitNho: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_TO_DIT_NHO', 'Đầu to - Đít nhỏ'),
            dauNhoDitTo: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_NHO_DIT_TO', 'Đầu nhỏ - Đít to'),
            dauNhoDitNho: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_NHO_DIT_NHO', 'Đầu nhỏ - Đít nhỏ'),
            
            dauChanLonHon4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_LON_HON_4', 'Đầu chẵn > 4'),
            dauChanNhoHon4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_NHO_HON_4', 'Đầu chẵn < 4'),
            ditChanLonHon4: analyzeGenericType(lotteryData, dateToIndexMap, 'DIT_CHAN_LON_HON_4', 'Đít chẵn > 4'),
            ditChanNhoHon4: analyzeGenericType(lotteryData, dateToIndexMap, 'DIT_CHAN_NHO_HON_4', 'Đít chẵn < 4'),

            dauLeLonHon5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_LON_HON_5', 'Đầu lẻ > 5'),
            dauLeNhoHon5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_NHO_HON_5', 'Đầu lẻ < 5'),
            ditLeLonHon5: analyzeGenericType(lotteryData, dateToIndexMap, 'DIT_LE_LON_HON_5', 'Đít lẻ > 5'),
            ditLeNhoHon5: analyzeGenericType(lotteryData, dateToIndexMap, 'DIT_LE_NHO_HON_5', 'Đít lẻ < 5'),

            dauChanLon4DitChanLon4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_LON_4_DIT_CHAN_LON_4', 'Đầu chẵn > 4 và Đít chẵn > 4'),
            dauChanLon4DitChanNho4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_LON_4_DIT_CHAN_NHO_4', 'Đầu chẵn > 4 và Đít chẵn < 4'),
            dauChanNho4DitChanLon4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_NHO_4_DIT_CHAN_LON_4', 'Đầu chẵn < 4 và Đít chẵn > 4'),
            dauChanNho4DitChanNho4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_NHO_4_DIT_CHAN_NHO_4', 'Đầu chẵn < 4 và Đít chẵn < 4'),
            
            dauChanLon4DitLeLon5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_LON_4_DIT_LE_LON_5', 'Đầu chẵn > 4 và Đít lẻ > 5'),
            dauChanLon4DitLeNho5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_LON_4_DIT_LE_NHO_5', 'Đầu chẵn > 4 và Đít lẻ < 5'),
            dauChanNho4DitLeLon5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_NHO_4_DIT_LE_LON_5', 'Đầu chẵn < 4 và Đít lẻ > 5'),
            dauChanNho4DitLeNho5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_CHAN_NHO_4_DIT_LE_NHO_5', 'Đầu chẵn < 4 và Đít lẻ < 5'),
            
            dauLeLon5DitChanLon4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_LON_5_DIT_CHAN_LON_4', 'Đầu lẻ > 5 và Đít chẵn > 4'),
            dauLeLon5DitChanNho4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_LON_5_DIT_CHAN_NHO_4', 'Đầu lẻ > 5 và Đít chẵn < 4'),
            dauLeNho5DitChanLon4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_NHO_5_DIT_CHAN_LON_4', 'Đầu lẻ < 5 và Đít chẵn > 4'),
            dauLeNho5DitChanNho4: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_NHO_5_DIT_CHAN_NHO_4', 'Đầu lẻ < 5 và Đít chẵn < 4'),

            dauLeLon5DitLeLon5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_LON_5_DIT_LE_LON_5', 'Đầu lẻ > 5 và Đít lẻ > 5'),
            dauLeLon5DitLeNho5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_LON_5_DIT_LE_NHO_5', 'Đầu lẻ > 5 và Đít lẻ < 5'),
            dauLeNho5DitLeLon5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_NHO_5_DIT_LE_LON_5', 'Đầu lẻ < 5 và Đít lẻ > 5'),
            dauLeNho5DitLeNho5: analyzeGenericType(lotteryData, dateToIndexMap, 'DAU_LE_NHO_5_DIT_LE_NHO_5', 'Đầu lẻ < 5 và Đít lẻ < 5'),
        };
        
        const specificConsecutiveOnly = [
            'DAU_4_DIT_CHAN_LON_4', 'DAU_4_DIT_CHAN_NHO_4', 'DAU_4_DIT_LE_LON_5', 'DAU_4_DIT_LE_NHO_5',
            'DAU_5_DIT_CHAN_LON_4', 'DAU_5_DIT_CHAN_NHO_4', 'DAU_5_DIT_LE_LON_5', 'DAU_5_DIT_LE_NHO_5',
            'DIT_4_DAU_CHAN_LON_4', 'DIT_4_DAU_CHAN_NHO_4', 'DIT_4_DAU_LE_LON_5', 'DIT_4_DAU_LE_NHO_5',
            'DIT_5_DAU_CHAN_LON_4', 'DIT_5_DAU_CHAN_NHO_4', 'DIT_5_DAU_LE_LON_5', 'DIT_5_DAU_LE_NHO_5'
        ];
        
        specificConsecutiveOnly.forEach(key => {
            const description = key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).replace(/Dau/g, 'Đầu').replace(/Dit/g, 'Đít');
            const filteredData = lotteryData.filter(item => MAPS[key].has(item.value));
            const keyName = key.toLowerCase().replace(/_/g, '');
            stats[keyName] = {
                veLienTiep: findGenericStreaks(filteredData, dateToIndexMap, (a, b) => true, `Dạng ${description} về liên tiếp`)
            };
        });


        await fs.writeFile(OUTPUT_FILE_PATH, JSON.stringify(stats, null, 2));
        console.log(`✅ Đã lưu kết quả thống kê Đầu-Đít vào: ${OUTPUT_FILE_PATH}`);

    } catch (error) {
        console.error("❌ Lỗi khi tạo file thống kê Đầu-Đít:", error);
    }
}

// Chạy hàm chính
generateHeadTailStats();

module.exports = generateHeadTailStats;
