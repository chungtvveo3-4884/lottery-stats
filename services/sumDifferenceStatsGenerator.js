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
        if (!condition(data[i])) continue; 

        const startValue = valueExtractor(data[i]);
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

function findAlternatingTypeStreaks(data, dateMap, { condition, description }) {
    const allStreaks = [];
    const processedDates = new Set();
    for (let i = 0; i < data.length - 2; i++) {
        const dayA = data[i];
        
        if (processedDates.has(dayA.date)) continue;

        const dayB = data[i + 1];
        const dayC = data[i + 2];

        if (isConsecutive(dayA.date, dayB.date) && isConsecutive(dayB.date, dayC.date) &&
            condition(dayA) &&
            condition(dayC)) 
        {
            let streak = [dayA, dayC];
            let lastIndex = i + 2;

            while (lastIndex < data.length - 2) {
                const nextDay = data[lastIndex + 1];
                const nextStreakDay = data[lastIndex + 2];

                if (nextDay && nextStreakDay && 
                    isConsecutive(data[lastIndex].date, nextDay.date) && 
                    isConsecutive(nextDay.date, nextStreakDay.date) && 
                    condition(nextStreakDay))
                {
                    streak.push(nextStreakDay);
                    lastIndex += 2;
                } else {
                    break;
                }
            }
            
            if (streak.length >= 2) {
                allStreaks.push(createStreakObject(data, dateMap, streak, { value: "Theo dạng" }));
                streak.forEach(item => processedDates.add(item.date));
            }
        }
    }
    return { description, streaks: allStreaks.filter(Boolean) };
}

function findAlternatingTypeStreaksNew(data, dateMap, numberMap) {
    const allStreaks = [];
    const processedDates = new Set(); 

    for (let i = 0; i < data.length - 2; i++) {
        const dayA = data[i];
        
        if (processedDates.has(dayA.date)) continue;

        const dayB = data[i+1];
        const dayC = data[i+2];

        if (isConsecutive(dayA.date, dayB.date) && isConsecutive(dayB.date, dayC.date) &&
            numberMap.has(dayA.value) && 
            !numberMap.has(dayB.value) && 
            numberMap.has(dayC.value)) 
        {
            let streak = [dayA, dayC];
            let lastIndex = i + 2;

            while (lastIndex < data.length - 2) {
                const nextDay = data[lastIndex + 1];
                const nextStreakDay = data[lastIndex + 2];
                if (nextDay && nextStreakDay && isConsecutive(data[lastIndex].date, nextDay.date) && isConsecutive(nextDay.date, nextStreakDay.date) && !numberMap.has(nextDay.value) && numberMap.has(nextStreakDay.value)) {
                    streak.push(nextStreakDay);
                    lastIndex += 2;
                } else {
                    break;
                }
            }
            if (streak.length >= 2) {
                allStreaks.push(createStreakObject(data, dateMap, streak, { value: "Theo dạng" }));
                streak.forEach(item => processedDates.add(item.date));
            }
        }
    }
    return { streaks: allStreaks.filter(Boolean) };
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

function analyzeNumberSet(data, dateMap, { typeName, descriptionPrefix }) {
    const typeCondition = (item) => MAPS[typeName] && MAPS[typeName].has(item.value);
    return {
        veLienTiep: findStreaks(data, dateMap, { condition: (a, b) => typeCondition(a) && typeCondition(b), description: `${descriptionPrefix} - Về liên tiếp` }),
        veSole: findAlternatingTypeStreaks(data, dateMap, {
            description: `${descriptionPrefix} về so le`,
            condition: typeCondition
        }),
        veSoleMoi: { 
            description: `${descriptionPrefix} - Về so le (mới)`, 
            ...findAlternatingTypeStreaksNew(data, dateMap, MAPS[typeName] || new Map())
        },
        tienLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: false, valueExtractor: getValue, numberSet: SETS[typeName], indexMap: MAPS[typeName], typeCondition, description: `${descriptionPrefix} - Tiến liên tiếp` }),
        tienDeuLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: true, valueExtractor: getValue, numberSet: SETS[typeName], indexMap: MAPS[typeName], typeCondition, description: `${descriptionPrefix} - Tiến Đều` }),
        luiLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: false, valueExtractor: getValue, numberSet: SETS[typeName], indexMap: MAPS[typeName], typeCondition, description: `${descriptionPrefix} - Lùi liên tiếp` }),
        luiDeuLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: true, valueExtractor: getValue, numberSet: SETS[typeName], indexMap: MAPS[typeName], typeCondition, description: `${descriptionPrefix} - Lùi Đều` }),
    };
}

function analyzeValueSequence(data, dateMap, { valueExtractor, valueSet, valueMap, descriptionPrefix, typeCondition }) {
    const isGroupAnalysis = !!typeCondition;
    const effectiveTypeCondition = typeCondition || (() => true);

    const results = {};

    const consecutiveCondition = isGroupAnalysis
        ? (a, b) => effectiveTypeCondition(a) && effectiveTypeCondition(b)
        : (a, b) => valueExtractor(a) === valueExtractor(b);

    results.veLienTiep = findStreaks(data, dateMap, {
        condition: consecutiveCondition,
        description: `${descriptionPrefix} - Về liên tiếp`
    });

    if (isGroupAnalysis) {
        results.veCungGiaTri = findStreaks(data, dateMap, {
            condition: (a, b) => effectiveTypeCondition(a) && effectiveTypeCondition(b) && valueExtractor(a) === valueExtractor(b),
            description: `${descriptionPrefix} - Về cùng giá trị`
        });
    }
    
    const veSoleResult = isGroupAnalysis
        ? findAlternatingTypeStreaks(data, dateMap, {
            condition: effectiveTypeCondition,
            description: `${descriptionPrefix} - Về so le`
          })
        : findAlternatingStreaks(data, dateMap, {
            condition: effectiveTypeCondition,
            valueExtractor,
            description: `${descriptionPrefix} - Về so le`
          });


    const valueBasedNumberMap = new Map(data.filter(effectiveTypeCondition).map(item => [item.value, true]));

    Object.assign(results, {
        veSole: veSoleResult,
        veSoleMoi: {
            description: `${descriptionPrefix} - Về so le (mới)`,
            ...findAlternatingTypeStreaksNew(data, dateMap, valueBasedNumberMap)
        },
        tienLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: false, valueExtractor, typeCondition: effectiveTypeCondition, description: `${descriptionPrefix} - Tiến liên tiếp` }),
        tienDeuLienTiep: findSequence(data, dateMap, { isProgressive: true, isUniform: true, valueExtractor, numberSet: valueSet, indexMap: valueMap, typeCondition: effectiveTypeCondition, description: `${descriptionPrefix} - Tiến Đều` }),
        luiLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: false, valueExtractor, typeCondition: effectiveTypeCondition, description: `${descriptionPrefix} - Lùi liên tiếp` }),
        luiDeuLienTiep: findSequence(data, dateMap, { isProgressive: false, isUniform: true, valueExtractor, numberSet: valueSet, indexMap: valueMap, typeCondition: effectiveTypeCondition, description: `${descriptionPrefix} - Lùi Đều` }),
    });

    return results;
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
        ];
        numberSetConfigs.forEach(config => {
            stats[config.typeName.toLowerCase()] = analyzeNumberSet(lotteryData, dateToIndexMap, config);
        });

        // === CÁC DẠNG XÉT CHUỖI GIÁ TRỊ TỔNG/HIỆU (dùng analyzeValueSequence) ===
        stats['tong_tt_cac_tong'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getTongTT(item.value), valueSet: SETS.TONG_TT_SEQUENCE, valueMap: MAPS.TONG_TT_SEQUENCE, descriptionPrefix: 'Tổng TT - Các tổng' });
        stats['tong_moi_cac_tong'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getTongMoi(item.value), valueSet: SETS.TONG_MOI_SEQUENCE, valueMap: MAPS.TONG_MOI_SEQUENCE, descriptionPrefix: 'Tổng Mới - Các tổng' });
        stats['hieu_cac_hieu'] = analyzeValueSequence(lotteryData, dateToIndexMap, { valueExtractor: (item) => getHieu(item.value), valueSet: SETS.HIEU_SEQUENCE, valueMap: MAPS.HIEU_SEQUENCE, descriptionPrefix: 'Các Hiệu' });

        stats['tong_tt_chan'] = analyzeValueSequence(lotteryData, dateToIndexMap, { 
            valueExtractor: (item) => getTongTT(item.value), 
            valueSet: SETS.TONG_TT_CHAN_SEQUENCE, 
            valueMap: MAPS.TONG_TT_CHAN_SEQUENCE, 
            descriptionPrefix: 'Tổng TT - Tổng Chẵn',
            typeCondition: (item) => getTongTT(item.value) % 2 === 0
        });
        stats['tong_tt_le'] = analyzeValueSequence(lotteryData, dateToIndexMap, { 
            valueExtractor: (item) => getTongTT(item.value), 
            valueSet: SETS.TONG_TT_LE_SEQUENCE, 
            valueMap: MAPS.TONG_TT_LE_SEQUENCE, 
            descriptionPrefix: 'Tổng TT - Tổng Lẻ',
            typeCondition: (item) => getTongTT(item.value) % 2 !== 0
        });
        
        stats['tong_moi_chan'] = analyzeValueSequence(lotteryData, dateToIndexMap, { 
            valueExtractor: (item) => getTongMoi(item.value), 
            valueSet: SETS.TONG_MOI_CHAN_SEQUENCE, 
            valueMap: MAPS.TONG_MOI_CHAN_SEQUENCE, 
            descriptionPrefix: 'Tổng Mới - Tổng Chẵn',
            typeCondition: (item) => getTongMoi(item.value) % 2 === 0
        });
        stats['tong_moi_le'] = analyzeValueSequence(lotteryData, dateToIndexMap, { 
            valueExtractor: (item) => getTongMoi(item.value), 
            valueSet: SETS.TONG_MOI_LE_SEQUENCE, 
            valueMap: MAPS.TONG_MOI_LE_SEQUENCE, 
            descriptionPrefix: 'Tổng Mới - Tổng Lẻ',
            typeCondition: (item) => getTongMoi(item.value) % 2 !== 0
        });

        stats['hieu_chan'] = analyzeValueSequence(lotteryData, dateToIndexMap, { 
            valueExtractor: (item) => getHieu(item.value), 
            valueSet: SETS.HIEU_CHAN_SEQUENCE, 
            valueMap: MAPS.HIEU_CHAN_SEQUENCE, 
            descriptionPrefix: 'Hiệu Chẵn',
            typeCondition: (item) => getHieu(item.value) % 2 === 0
        });
        stats['hieu_le'] = analyzeValueSequence(lotteryData, dateToIndexMap, { 
            valueExtractor: (item) => getHieu(item.value), 
            valueSet: SETS.HIEU_LE_SEQUENCE, 
            valueMap: MAPS.HIEU_LE_SEQUENCE, 
            descriptionPrefix: 'Hiệu Lẻ',
            typeCondition: (item) => getHieu(item.value) % 2 !== 0
        });

        const dangTongConfigs = [
            { typeName: 'TONG_MOI_CHAN_CHAN', descriptionPrefix: 'Tổng Mới - Dạng Chẵn-Chẵn', getter: getTongMoi, sequenceSet: SETS.TONG_MOI_SEQUENCE, sequenceMap: MAPS.TONG_MOI_SEQUENCE },
            { typeName: 'TONG_MOI_CHAN_LE', descriptionPrefix: 'Tổng Mới - Dạng Chẵn-Lẻ', getter: getTongMoi, sequenceSet: SETS.TONG_MOI_SEQUENCE, sequenceMap: MAPS.TONG_MOI_SEQUENCE },
            { typeName: 'TONG_MOI_LE_CHAN', descriptionPrefix: 'Tổng Mới - Dạng Lẻ-Chẵn', getter: getTongMoi, sequenceSet: SETS.TONG_MOI_SEQUENCE, sequenceMap: MAPS.TONG_MOI_SEQUENCE },
            { typeName: 'TONG_MOI_LE_LE', descriptionPrefix: 'Tổng Mới - Dạng Lẻ-Lẻ', getter: getTongMoi, sequenceSet: SETS.TONG_MOI_SEQUENCE, sequenceMap: MAPS.TONG_MOI_SEQUENCE },
            { typeName: 'TONG_TT_CHAN_CHAN', descriptionPrefix: 'Tổng TT - Dạng Chẵn-Chẵn', getter: getTongTT, sequenceSet: SETS.TONG_TT_SEQUENCE, sequenceMap: MAPS.TONG_TT_SEQUENCE },
            { typeName: 'TONG_TT_CHAN_LE', descriptionPrefix: 'Tổng TT - Dạng Chẵn-Lẻ', getter: getTongTT, sequenceSet: SETS.TONG_TT_SEQUENCE, sequenceMap: MAPS.TONG_TT_SEQUENCE },
            { typeName: 'TONG_TT_LE_CHAN', descriptionPrefix: 'Tổng TT - Dạng Lẻ-Chẵn', getter: getTongTT, sequenceSet: SETS.TONG_TT_SEQUENCE, sequenceMap: MAPS.TONG_TT_SEQUENCE },
            { typeName: 'TONG_TT_LE_LE', descriptionPrefix: 'Tổng TT - Dạng Lẻ-Lẻ', getter: getTongTT, sequenceSet: SETS.TONG_TT_SEQUENCE, sequenceMap: MAPS.TONG_TT_SEQUENCE },
        ];

        dangTongConfigs.forEach(config => {
            stats[config.typeName.toLowerCase()] = analyzeValueSequence(lotteryData, dateToIndexMap, {
                valueExtractor: (item) => config.getter(item.value),
                valueSet: config.sequenceSet,
                valueMap: config.sequenceMap,
                descriptionPrefix: config.descriptionPrefix,
                typeCondition: (item) => MAPS[config.typeName] && MAPS[config.typeName].has(item.value)
            });
        });

        // [ADDED] Xử lý các dạng nhóm tổng/hiệu bằng analyzeValueSequence
        const dangNhomConfigs = [
            { typeName: 'TONG_TT_1_3', descriptionPrefix: 'Tổng TT - Dạng tổng (1,2,3)', getter: getTongTT, sequence: ['1', '2', '3'] },
            { typeName: 'TONG_TT_4_6', descriptionPrefix: 'Tổng TT - Dạng tổng (4,5,6)', getter: getTongTT, sequence: ['4', '5', '6'] },
            { typeName: 'TONG_TT_7_10', descriptionPrefix: 'Tổng TT - Dạng tổng (7,8,9,10)', getter: getTongTT, sequence: ['7', '8', '9', '10'] },
            { typeName: 'TONG_MOI_0_3', descriptionPrefix: 'Tổng Mới - Dạng tổng (0-3)', getter: getTongMoi, sequence: ['0', '1', '2', '3'] },
            { typeName: 'TONG_MOI_4_6', descriptionPrefix: 'Tổng Mới - Dạng tổng (4-6)', getter: getTongMoi, sequence: ['4', '5', '6'] },
            { typeName: 'TONG_MOI_7_9', descriptionPrefix: 'Tổng Mới - Dạng tổng (7-9)', getter: getTongMoi, sequence: ['7', '8', '9'] },
            { typeName: 'TONG_MOI_10_12', descriptionPrefix: 'Tổng Mới - Dạng tổng (10-12)', getter: getTongMoi, sequence: ['10', '11', '12'] },
            { typeName: 'TONG_MOI_13_15', descriptionPrefix: 'Tổng Mới - Dạng tổng (13-15)', getter: getTongMoi, sequence: ['13', '14', '15'] },
            { typeName: 'TONG_MOI_16_18', descriptionPrefix: 'Tổng Mới - Dạng tổng (16-18)', getter: getTongMoi, sequence: ['16', '17', '18'] },
            { typeName: 'HIEU_0_2', descriptionPrefix: 'Hiệu - Dạng hiệu (0,1,2)', getter: getHieu, sequence: ['0', '1', '2'] },
            { typeName: 'HIEU_3_5', descriptionPrefix: 'Hiệu - Dạng hiệu (3,4,5)', getter: getHieu, sequence: ['3', '4', '5'] },
            { typeName: 'HIEU_6_9', descriptionPrefix: 'Hiệu - Dạng hiệu (6,7,8,9)', getter: getHieu, sequence: ['6', '7', '8', '9'] },
        ];

        dangNhomConfigs.forEach(config => {
            const sequenceSet = config.sequence;
            const sequenceMap = new Map(sequenceSet.map((item, index) => [item, index]));
            
            stats[config.typeName.toLowerCase()] = analyzeValueSequence(lotteryData, dateToIndexMap, {
                valueExtractor: (item) => config.getter(item.value),
                valueSet: sequenceSet,
                valueMap: sequenceMap,
                descriptionPrefix: config.descriptionPrefix,
                typeCondition: (item) => MAPS[config.typeName] && MAPS[config.typeName].has(item.value)
            });
        });


        await fs.writeFile(OUTPUT_FILE_PATH, JSON.stringify(stats, null, 2));
        console.log(`✅ Đã lưu kết quả thống kê Tổng-Hiệu vào: ${OUTPUT_FILE_PATH}`);

    } catch (error) {
        console.error("❌ Lỗi khi tạo file thống kê Tổng-Hiệu:", error);
    }
}

module.exports = generateSumDifferenceStats;