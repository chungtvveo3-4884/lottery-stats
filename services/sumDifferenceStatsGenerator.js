const fs = require('fs').promises;
const path = require('path');
const { 
    SETS, 
    MAPS, 
    INDEX_MAPS, 
    getTongMoi, 
    getTongTT, 
    getHieu, 
    findNextInSet, 
    findPreviousInSet 
} = require('../utils/numberAnalysis');

const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
const OUTPUT_FILE_PATH = path.join(__dirname, '..', 'data', 'statistics', 'sum_difference_stats.json');

// --- CÁC HÀM TIỆN ÍCH ---
const getValue = (item) => item.value;

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDate(dateString) {
    if (!dateString) return null;
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

// --- CÁC HÀM TÌM CHUỖI ---

function findStreaks(data, dateMap, { condition, description }) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 1; i++) {
        if (!condition(data[i], data[i])) continue;
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

function findAlternatingStreaks(data, dateMap, { condition, description, valueExtractor }) {
     const allStreaks = [];
     const processedStreaks = new Set();
     for (let i = 0; i < data.length - 2; i++) {
        const startValue = valueExtractor(data[i]);
        if (!startValue || !condition(data[i])) continue;
        if (isConsecutive(data[i].date, data[i + 1].date) && isConsecutive(data[i + 1].date, data[i + 2].date)) {
            if (condition(data[i+2]) && startValue === valueExtractor(data[i+2])) {
                const streakKey = `${startValue}-${data[i].date}`;
                if (processedStreaks.has(streakKey)) continue;
                let streak = [data[i], data[i+2]];
                let lastIndex = i + 2;
                while(lastIndex < data.length - 2) {
                    const nextPossibleIndex = lastIndex + 2;
                    if (data[nextPossibleIndex] && data[lastIndex + 1] && isConsecutive(data[lastIndex].date, data[lastIndex + 1].date) && isConsecutive(data[lastIndex + 1].date, data[nextPossibleIndex].date) && condition(data[nextPossibleIndex]) && startValue === valueExtractor(data[nextPossibleIndex])) {
                        streak.push(data[nextPossibleIndex]);
                        lastIndex = nextPossibleIndex;
                    } else {
                        break;
                    }
                }
                if (streak.length >= 2) {
                    const finalStreak = createStreakObject(data, dateMap, streak, { value: `${description.split(' ')[0]} ${startValue}` });
                    if(finalStreak) {
                        allStreaks.push(finalStreak);
                        streak.forEach(item => processedStreaks.add(`${startValue}-${item.date}`));
                    }
                }
            }
        }
    }
    return { description, streaks: allStreaks.filter(Boolean) };
}

function findSequence(data, dateMap, { isProgressive, isUniform, valueExtractor, numberSet, indexMap, typeCondition, description }) {
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
            const strVal1 = String(val1);
            const strVal2 = String(val2);
            let valueCondition;
            if (isProgressive) {
                valueCondition = isUniform ? findNextInSet(strVal1, numberSet, indexMap) === strVal2 : val2 > val1;
            } else {
                valueCondition = isUniform ? findPreviousInSet(strVal1, numberSet, indexMap) === strVal2 : val2 < val1;
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

// Hàm này dùng để xét chuỗi của các con số
function analyzeNumberSet(data, dateMap, { typeName, descriptionPrefix }) {
    const typeCondition = (item) => MAPS[typeName].has(item.value);
    return {
        veLienTiep: findStreaks(data, dateMap, { condition: (a, b) => typeCondition(a) && typeCondition(b), description: `${descriptionPrefix} - Về liên tiếp` }),
        veSole: findAlternatingStreaks(data, dateMap, { condition: typeCondition, valueExtractor: getValue, description: `${descriptionPrefix} - Về so le` }),
        tienLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: false, valueExtractor: getValue, numberSet: SETS[typeName], indexMap: MAPS[typeName], typeCondition, description: `${descriptionPrefix} - Tiến liên tiếp` }),
        tienDeuLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: true, valueExtractor: getValue, numberSet: SETS[typeName], indexMap: MAPS[typeName], typeCondition, description: `${descriptionPrefix} - Tiến Đều` }),
        luiLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: false, valueExtractor: getValue, numberSet: SETS[typeName], indexMap: MAPS[typeName], typeCondition, description: `${descriptionPrefix} - Lùi liên tiếp` }),
        luiDeuLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: true, valueExtractor: getValue, numberSet: SETS[typeName], indexMap: MAPS[typeName], typeCondition, description: `${descriptionPrefix} - Lùi Đều` }),
    };
}

// Hàm này dùng để xét chuỗi của các giá trị Tổng/Hiệu
function analyzeValueSequence(data, dateMap, { valueExtractor, valueSet, valueMap, descriptionPrefix }) {
    return {
        veLienTiep: findStreaks(data, dateMap, { condition: (a, b) => valueExtractor(a) === valueExtractor(b), description: `${descriptionPrefix} - Về liên tiếp` }),
        veSole: findAlternatingStreaks(data, dateMap, { condition: () => true, valueExtractor, description: `${descriptionPrefix} - Về so le` }),
        tienLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: false, valueExtractor, typeCondition: () => true, description: `${descriptionPrefix} - Tiến liên tiếp` }),
        tienDeuLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: true, valueExtractor, numberSet: valueSet, indexMap: valueMap, typeCondition: () => true, description: `${descriptionPrefix} - Tiến Đều` }),
        luiLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: false, valueExtractor, typeCondition: () => true, description: `${descriptionPrefix} - Lùi liên tiếp` }),
        luiDeuLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: true, valueExtractor, numberSet: valueSet, indexMap: valueMap, typeCondition: () => true, description: `${descriptionPrefix} - Lùi Đều` }),
    };
}


async function generateSumDifferenceStats() {
    try {
        await fs.mkdir(path.dirname(OUTPUT_FILE_PATH), { recursive: true });
        const rawData = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        const originalData = JSON.parse(rawData);
        const lotteryData = originalData.map(item => (item.special === null || typeof item.special !== 'number' || isNaN(item.special)) ? null : {
            date: formatDate(item.date),
            value: String(item.special).padStart(2, '0')
        }).filter(item => item !== null).sort((a, b) => parseDate(a.date) - parseDate(b.date));
        const dateToIndexMap = new Map(lotteryData.map((item, index) => [item.date, index]));
        console.log('Bắt đầu tính toán thống kê cho Tổng và Hiệu...');

        const stats = {};

        // === CÁC DẠNG XÉT CHUỖI SỐ (dùng analyzeNumberSet) ===
        const numberSetConfigs = [
            ...Array.from({ length: 10 }, (_, i) => ({ typeName: `TONG_TT_${i + 1}`, descriptionPrefix: `Tổng TT - Cùng tổng ${i + 1}` })),
            ...Array.from({ length: 19 }, (_, i) => ({ typeName: `TONG_MOI_${i}`, descriptionPrefix: `Tổng Mới - Cùng tổng ${i}` })),
            ...Array.from({ length: 10 }, (_, i) => ({ typeName: `HIEU_${i}`, descriptionPrefix: `Hiệu - Cùng hiệu ${i}` })),
            { typeName: 'TONG_TT_1_2', descriptionPrefix: 'Tổng TT - Dạng tổng (1,2)' },
            { typeName: 'TONG_TT_3_4', descriptionPrefix: 'Tổng TT - Dạng tổng (3,4)' },
            { typeName: 'TONG_TT_5_6', descriptionPrefix: 'Tổng TT - Dạng tổng (5,6)' },
            { typeName: 'TONG_TT_7_8', descriptionPrefix: 'Tổng TT - Dạng tổng (7,8)' },
            { typeName: 'TONG_TT_9_10', descriptionPrefix: 'Tổng TT - Dạng tổng (9,10)' },
            { typeName: 'TONG_MOI_0_3', descriptionPrefix: 'Tổng Mới - Dạng tổng (0-3)' },
            { typeName: 'TONG_MOI_4_6', descriptionPrefix: 'Tổng Mới - Dạng tổng (4-6)' },
            { typeName: 'TONG_MOI_7_9', descriptionPrefix: 'Tổng Mới - Dạng tổng (7-9)' },
            { typeName: 'TONG_MOI_10_12', descriptionPrefix: 'Tổng Mới - Dạng tổng (10-12)' },
            { typeName: 'TONG_MOI_13_15', descriptionPrefix: 'Tổng Mới - Dạng tổng (13-15)' },
            { typeName: 'TONG_MOI_16_18', descriptionPrefix: 'Tổng Mới - Dạng tổng (16-18)' },
            { typeName: 'HIEU_0_1', descriptionPrefix: 'Hiệu - Dạng hiệu (0,1)' },
            { typeName: 'HIEU_2_3', descriptionPrefix: 'Hiệu - Dạng hiệu (2,3)' },
            { typeName: 'HIEU_4_5', descriptionPrefix: 'Hiệu - Dạng hiệu (4,5)' },
            { typeName: 'HIEU_6_7', descriptionPrefix: 'Hiệu - Dạng hiệu (6,7)' },
            { typeName: 'HIEU_8_9', descriptionPrefix: 'Hiệu - Dạng hiệu (8,9)' },
        ];
        numberSetConfigs.forEach(config => {
            stats[config.typeName.toLowerCase()] = analyzeNumberSet(lotteryData, dateToIndexMap, config);
        });

        // === CÁC DẠNG XÉT CHUỖI GIÁ TRỊ TỔNG/HIỆU (dùng analyzeValueSequence) ===
        stats['tong_tt_cac_tong'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getTongTT(item.value), valueSet: SETS.TONG_TT_SEQUENCE, valueMap: MAPS.TONG_TT_SEQUENCE, descriptionPrefix: 'Tổng TT - Các tổng' });
        stats['tong_moi_cac_tong'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getTongMoi(item.value), valueSet: SETS.TONG_MOI_SEQUENCE, valueMap: MAPS.TONG_MOI_SEQUENCE, descriptionPrefix: 'Tổng Mới - Các tổng' });
        stats['hieu_cac_hieu'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getHieu(item.value), valueSet: SETS.HIEU_SEQUENCE, valueMap: MAPS.HIEU_SEQUENCE, descriptionPrefix: 'Các Hiệu' });

        stats['tong_tt_chan'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getTongTT(item.value), valueSet: SETS.TONG_TT_CHAN_SEQUENCE, valueMap: MAPS.TONG_TT_CHAN_SEQUENCE, descriptionPrefix: 'Tổng TT - Tổng Chẵn' });
        stats['tong_tt_le'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getTongTT(item.value), valueSet: SETS.TONG_TT_LE_SEQUENCE, valueMap: MAPS.TONG_TT_LE_SEQUENCE, descriptionPrefix: 'Tổng TT - Tổng Lẻ' });
        
        stats['tong_moi_chan'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getTongMoi(item.value), valueSet: SETS.TONG_MOI_CHAN_SEQUENCE, valueMap: MAPS.TONG_MOI_CHAN_SEQUENCE, descriptionPrefix: 'Tổng Mới - Tổng Chẵn' });
        stats['tong_moi_le'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getTongMoi(item.value), valueSet: SETS.TONG_MOI_LE_SEQUENCE, valueMap: MAPS.TONG_MOI_LE_SEQUENCE, descriptionPrefix: 'Tổng Mới - Tổng Lẻ' });

        stats['hieu_chan'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getHieu(item.value), valueSet: SETS.HIEU_CHAN_SEQUENCE, valueMap: MAPS.HIEU_CHAN_SEQUENCE, descriptionPrefix: 'Hiệu Chẵn' });
        stats['hieu_le'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getHieu(item.value), valueSet: SETS.HIEU_LE_SEQUENCE, valueMap: MAPS.HIEU_LE_SEQUENCE, descriptionPrefix: 'Hiệu Lẻ' });


        await fs.writeFile(OUTPUT_FILE_PATH, JSON.stringify(stats, null, 2));
        console.log(`✅ Đã lưu kết quả thống kê Tổng-Hiệu vào: ${OUTPUT_FILE_PATH}`);

    } catch (error) {
        console.error("❌ Lỗi khi tạo file thống kê Tổng-Hiệu:", error);
    }
}

if (require.main === module) {
    generateSumDifferenceStats();
}

module.exports = generateSumDifferenceStats;