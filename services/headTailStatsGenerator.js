const fs = require('fs').promises;
const path = require('path');
const { SETS, MAPS, INDEX_MAPS, DIGIT_SETS, DIGIT_MAPS, findNextInSet, findPreviousInSet } = require('../utils/numberAnalysis');

const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
const OUTPUT_FILE_PATH = path.join(__dirname, '..', 'data', 'statistics', 'head_tail_stats.json');

// --- HÀM TIỆN ÍCH ---
const getHead = (item) => item.value[0];
const getTail = (item) => item.value[1];
const getValue = (item) => item.value;

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

function isConsecutive(dateStr1, dateStr2) {
    if (!dateStr1 || !dateStr2) return false;
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    const oneDay = 24 * 60 * 60 * 1000;
    return d2.getTime() - d1.getTime() === oneDay;
}

function createStreakObject(data, dateMap, streak, typeSpecificData = {}) {
    if (!streak || streak.length < 2) return null;
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

// --- CÁC HÀM TÌM CHUỖI CHUNG (LOGIC MỚI, LINH HOẠT) ---

function findStreaks(data, dateMap, { condition, description }) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 1; i++) {
        if (!condition(data[i], data[i])) continue; // Bỏ qua nếu item đầu không hợp lệ

        let currentStreak = [data[i]];
        for (let j = i; j < data.length - 1; j++) {
            if (isConsecutive(data[j].date, data[j + 1].date) && condition(data[j], data[j + 1])) {
                currentStreak.push(data[j + 1]);
            } else {
                break;
            }
        }
        if (currentStreak.length > 1) {
            allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            i += currentStreak.length - 1;
        }
    }
    return { description, streaks: allStreaks.filter(Boolean) };
}

function findAlternatingStreaks(data, dateMap, { condition, description }) {
    const allStreaks = [];
     for (let i = 0; i < data.length - 2; i++) {
        if(condition(data[i]) && condition(data[i+2]) && isConsecutive(data[i].date, data[i+1].date) && isConsecutive(data[i+1].date, data[i+2].date)) {
            let streak = [data[i], data[i+2]];
            let lastIndex = i + 2;
            while(data[lastIndex + 2] && isConsecutive(data[lastIndex+1].date, data[lastIndex+2].date) && condition(data[lastIndex+2])) {
                streak.push(data[lastIndex+2]);
                lastIndex += 2;
            }
            allStreaks.push(createStreakObject(data, dateMap, streak));
            i = lastIndex -1;
        }
    }
    return { description, streaks: allStreaks.filter(Boolean) };
}


function findSequence(data, dateMap, { isProgressive, isUniform, valueExtractor, numberSet, numberMap, typeCondition, description }) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 1; i++) {
        if (!typeCondition(data[i])) continue;

        let currentStreak = [data[i]];
        for (let j = i; j < data.length - 1; j++) {
            const currentItem = data[j];
            const nextItem = data[j + 1];

            if (!isConsecutive(currentItem.date, nextItem.date) || !typeCondition(nextItem)) {
                break;
            }

            const val1 = valueExtractor(currentItem);
            const val2 = valueExtractor(nextItem);

            let valueCondition;
            if (isProgressive) {
                valueCondition = isUniform
                    ? findNextInSet(val1, numberSet, numberMap) === val2
                    : parseInt(val2, 10) > parseInt(val1, 10);
            } else { // Regressive
                valueCondition = isUniform
                    ? findPreviousInSet(val1, numberSet, numberMap) === val2
                    : parseInt(val2, 10) < parseInt(val1, 10);
            }
            
            if (valueCondition) {
                currentStreak.push(nextItem);
            } else {
                break;
            }
        }

        if (currentStreak.length > 1) {
            allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            i += currentStreak.length - 2; 
        }
    }
    return { description, streaks: allStreaks.filter(Boolean) };
}

/**
 * Hàm tổng hợp để phân tích một "dạng" đầy đủ
 */
function analyzeType(data, dateMap, { typeName, descriptionPrefix, valueExtractor, digitSetKey, isTwoDigitSequence = false }) {
    const typeCondition = (item) => MAPS[typeName].has(item.value);
    const numberSet = isTwoDigitSequence ? SETS[typeName] : DIGIT_SETS[digitSetKey];
    const numberMap = isTwoDigitSequence ? INDEX_MAPS[typeName] : DIGIT_MAPS[digitSetKey];

    return {
        veLienTiep: findStreaks(data, dateMap, {
            condition: (a, b) => typeCondition(a) && typeCondition(b),
            description: `${descriptionPrefix} về liên tiếp`
        }),
        veSole: findAlternatingStreaks(data, dateMap, {
            condition: (item) => typeCondition(item),
            description: `${descriptionPrefix} về so le`
        }),
        tienLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: false, valueExtractor, numberSet, numberMap, typeCondition, description: `${descriptionPrefix} tiến liên tiếp` }),
        tienDeuLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: true, valueExtractor, numberSet, numberMap, typeCondition, description: `${descriptionPrefix} tiến ĐỀU liên tiếp` }),
        luiLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: false, valueExtractor, numberSet, numberMap, typeCondition, description: `${descriptionPrefix} lùi liên tiếp` }),
        luiDeuLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: true, valueExtractor, numberSet, numberMap, typeCondition, description: `${descriptionPrefix} lùi ĐỀU liên tiếp` }),
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
            // --- CÁC THỐNG KÊ CƠ BẢN ---
            motDauVeLienTiep: findStreaks(lotteryData, dateToIndexMap, { condition: (a, b) => getHead(a) === getHead(b), description: "1 Đầu về liên tiếp" }),
            motDauVeSole: findAlternatingStreaks(lotteryData, dateToIndexMap, { condition: (item) => true, description: "1 Đầu về so le" }), // Cần logic riêng
            cacDauTien: findSequence(lotteryData, dateToIndexMap, { isProgressive: true, isUniform: false, valueExtractor: getHead, numberSet: DIGIT_SETS.DIGITS, numberMap: DIGIT_MAPS.DIGITS, typeCondition: () => true, description: "Các Đầu tiến liên tiếp" }),
            cacDauTienDeu: findSequence(lotteryData, dateToIndexMap, { isProgressive: true, isUniform: true, valueExtractor: getHead, numberSet: DIGIT_SETS.DIGITS, numberMap: DIGIT_MAPS.DIGITS, typeCondition: () => true, description: "Các Đầu tiến ĐỀU liên tiếp" }),
            cacDauLui: findSequence(lotteryData, dateToIndexMap, { isProgressive: false, isUniform: false, valueExtractor: getHead, numberSet: DIGIT_SETS.DIGITS, numberMap: DIGIT_MAPS.DIGITS, typeCondition: () => true, description: "Các Đầu lùi liên tiếp" }),
            cacDauLuiDeu: findSequence(lotteryData, dateToIndexMap, { isProgressive: false, isUniform: true, valueExtractor: getHead, numberSet: DIGIT_SETS.DIGITS, numberMap: DIGIT_MAPS.DIGITS, typeCondition: () => true, description: "Các Đầu lùi ĐỀU liên tiếp" }),
            motDitVeLienTiep: findStreaks(lotteryData, dateToIndexMap, { condition: (a, b) => getTail(a) === getTail(b), description: "1 Đít về liên tiếp" }),
            motDitVeSole: findAlternatingStreaks(lotteryData, dateToIndexMap, { condition: (item) => true, description: "1 Đít về so le" }), // Cần logic riêng
            cacDitTien: findSequence(lotteryData, dateToIndexMap, { isProgressive: true, isUniform: false, valueExtractor: getTail, numberSet: DIGIT_SETS.DIGITS, numberMap: DIGIT_MAPS.DIGITS, typeCondition: () => true, description: "Các Đít tiến liên tiếp" }),
            cacDitTienDeu: findSequence(lotteryData, dateToIndexMap, { isProgressive: true, isUniform: true, valueExtractor: getTail, numberSet: DIGIT_SETS.DIGITS, numberMap: DIGIT_MAPS.DIGITS, typeCondition: () => true, description: "Các Đít tiến ĐỀU liên tiếp" }),
            cacDitLui: findSequence(lotteryData, dateToIndexMap, { isProgressive: false, isUniform: false, valueExtractor: getTail, numberSet: DIGIT_SETS.DIGITS, numberMap: DIGIT_MAPS.DIGITS, typeCondition: () => true, description: "Các Đít lùi liên tiếp" }),
            cacDitLuiDeu: findSequence(lotteryData, dateToIndexMap, { isProgressive: false, isUniform: true, valueExtractor: getTail, numberSet: DIGIT_SETS.DIGITS, numberMap: DIGIT_MAPS.DIGITS, typeCondition: () => true, description: "Các Đít lùi ĐỀU liên tiếp" }),
        };

        // --- CẤU HÌNH CHO CÁC DẠNG THỐNG KÊ PHỨC TẠP ---
        const analysisConfigs = [
            // Đầu Chẵn/Lẻ & Đít Chẵn/Lẻ
            { typeName: 'DAU_CHAN', descriptionPrefix: 'Đầu chẵn', valueExtractor: getHead, digitSetKey: 'CHAN_DIGITS' },
            { typeName: 'DAU_LE', descriptionPrefix: 'Đầu lẻ', valueExtractor: getHead, digitSetKey: 'LE_DIGITS' },
            { typeName: 'DIT_CHAN', descriptionPrefix: 'Đít chẵn', valueExtractor: getTail, digitSetKey: 'CHAN_DIGITS' },
            { typeName: 'DIT_LE', descriptionPrefix: 'Đít lẻ', valueExtractor: getTail, digitSetKey: 'LE_DIGITS' },
            // Đầu To/Nhỏ & Đít To/Nhỏ
            { typeName: 'DAU_TO_DIT_TO', descriptionPrefix: 'Đầu to đít to', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_TO_DIT_NHO', descriptionPrefix: 'Đầu to đít nhỏ', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_NHO_DIT_TO', descriptionPrefix: 'Đầu nhỏ đít to', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_NHO_DIT_NHO', descriptionPrefix: 'Đầu nhỏ đít nhỏ', valueExtractor: getValue, isTwoDigitSequence: true },
             // Đầu/Đít Chẵn/Lẻ và Lớn/Nhỏ
            { typeName: 'DAU_CHAN_LON_HON_4', descriptionPrefix: 'Đầu chẵn > 4', valueExtractor: getHead, digitSetKey: 'CHAN_LON_HON_4_DIGITS' },
            { typeName: 'DAU_CHAN_NHO_HON_4', descriptionPrefix: 'Đầu chẵn < 4', valueExtractor: getHead, digitSetKey: 'CHAN_NHO_HON_4_DIGITS' },
            { typeName: 'DIT_CHAN_LON_HON_4', descriptionPrefix: 'Đít chẵn > 4', valueExtractor: getTail, digitSetKey: 'CHAN_LON_HON_4_DIGITS' },
            { typeName: 'DIT_CHAN_NHO_HON_4', descriptionPrefix: 'Đít chẵn < 4', valueExtractor: getTail, digitSetKey: 'CHAN_NHO_HON_4_DIGITS' },
            { typeName: 'DAU_LE_LON_HON_5', descriptionPrefix: 'Đầu lẻ > 5', valueExtractor: getHead, digitSetKey: 'LE_LON_HON_5_DIGITS' },
            { typeName: 'DAU_LE_NHO_HON_5', descriptionPrefix: 'Đầu lẻ < 5', valueExtractor: getHead, digitSetKey: 'LE_NHO_HON_5_DIGITS' },
            { typeName: 'DIT_LE_LON_HON_5', descriptionPrefix: 'Đít lẻ > 5', valueExtractor: getTail, digitSetKey: 'LE_LON_HON_5_DIGITS' },
            { typeName: 'DIT_LE_NHO_HON_5', descriptionPrefix: 'Đít lẻ < 5', valueExtractor: getTail, digitSetKey: 'LE_NHO_HON_5_DIGITS' },
            // Kết hợp phức tạp
            { typeName: 'DAU_CHAN_LON_4_DIT_CHAN_LON_4', descriptionPrefix: 'Đầu chẵn > 4 và đít chẵn > 4', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_CHAN_LON_4_DIT_CHAN_NHO_4', descriptionPrefix: 'Đầu chẵn > 4 và đít chẵn < 4', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_CHAN_NHO_4_DIT_CHAN_LON_4', descriptionPrefix: 'Đầu chẵn < 4 và đít chẵn > 4', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_CHAN_NHO_4_DIT_CHAN_NHO_4', descriptionPrefix: 'Đầu chẵn < 4 và đít chẵn < 4', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_CHAN_LON_4_DIT_LE_LON_5', descriptionPrefix: 'Đầu chẵn > 4 và đít lẻ > 5', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_CHAN_LON_4_DIT_LE_NHO_5', descriptionPrefix: 'Đầu chẵn > 4 và đít lẻ < 5', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_CHAN_NHO_4_DIT_LE_LON_5', descriptionPrefix: 'Đầu chẵn < 4 và đít lẻ > 5', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_CHAN_NHO_4_DIT_LE_NHO_5', descriptionPrefix: 'Đầu chẵn < 4 và đít lẻ < 5', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_LE_LON_5_DIT_CHAN_LON_4', descriptionPrefix: 'Đầu lẻ > 5 và đít chẵn > 4', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_LE_LON_5_DIT_CHAN_NHO_4', descriptionPrefix: 'Đầu lẻ > 5 và đít chẵn < 4', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_LE_NHO_5_DIT_CHAN_LON_4', descriptionPrefix: 'Đầu lẻ < 5 và đít chẵn > 4', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_LE_NHO_5_DIT_CHAN_NHO_4', descriptionPrefix: 'Đầu lẻ < 5 và đít chẵn < 4', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_LE_LON_5_DIT_LE_LON_5', descriptionPrefix: 'Đầu lẻ > 5 và đít lẻ > 5', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_LE_LON_5_DIT_LE_NHO_5', descriptionPrefix: 'Đầu lẻ > 5 và đít lẻ < 5', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_LE_NHO_5_DIT_LE_LON_5', descriptionPrefix: 'Đầu lẻ < 5 và đít lẻ > 5', valueExtractor: getValue, isTwoDigitSequence: true },
            { typeName: 'DAU_LE_NHO_5_DIT_LE_NHO_5', descriptionPrefix: 'Đầu lẻ < 5 và đít lẻ < 5', valueExtractor: getValue, isTwoDigitSequence: true },
        ];

        analysisConfigs.forEach(config => {
            const key = config.typeName.toLowerCase();
            stats[key] = analyzeType(lotteryData, dateToIndexMap, config);
        });
        
        // Dạng đặc biệt chỉ có "về liên tiếp"
        const consecutiveOnlyConfigs = [
            'DAU_4_DIT_CHAN_LON_4', 'DAU_4_DIT_CHAN_NHO_4', 'DAU_4_DIT_LE_LON_5', 'DAU_4_DIT_LE_NHO_5',
            'DAU_5_DIT_CHAN_LON_4', 'DAU_5_DIT_CHAN_NHO_4', 'DAU_5_DIT_LE_LON_5', 'DAU_5_DIT_LE_NHO_5',
            'DIT_4_DAU_CHAN_LON_4', 'DIT_4_DAU_CHAN_NHO_4', 'DIT_4_DAU_LE_LON_5', 'DIT_4_DAU_LE_NHO_5',
            'DIT_5_DAU_CHAN_LON_4', 'DIT_5_DAU_CHAN_NHO_4', 'DIT_5_DAU_LE_LON_5', 'DIT_5_DAU_LE_NHO_5'
        ];

        consecutiveOnlyConfigs.forEach(typeName => {
            const key = typeName.toLowerCase();
            const description = typeName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).replace(/Dau/g, 'Đầu').replace(/Dit/g, 'Đít');
            stats[key] = {
                 veLienTiep: findStreaks(lotteryData, dateToIndexMap, {
                    condition: (a, b) => MAPS[typeName].has(a.value) && MAPS[typeName].has(b.value),
                    description: `Dạng ${description} về liên tiếp`
                })
            }
        });


        await fs.writeFile(OUTPUT_FILE_PATH, JSON.stringify(stats, null, 2));
        console.log(`✅ Đã lưu kết quả thống kê Đầu-Đít vào: ${OUTPUT_FILE_PATH}`);

    } catch (error) {
        console.error("❌ Lỗi khi tạo file thống kê Đầu-Đít:", error);
    }
}

generateHeadTailStats();

module.exports = generateHeadTailStats;