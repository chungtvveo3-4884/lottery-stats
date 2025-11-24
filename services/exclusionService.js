const statisticsService = require('./statisticsService');
const { SETS, findNextInSet, findPreviousInSet, getTongTT, getTongMoi, getHieu } = require('../utils/numberAnalysis');

// Helper functions copied from suggestionsController
function getNumbersFromCategory(category) {
    let setKey = category.toUpperCase();

    // Handle specific mappings
    if (category.startsWith('dau_')) {
        setKey = 'DAU_' + category.split('_')[1].toUpperCase();
    } else if (category.startsWith('dit_')) {
        setKey = 'DIT_' + category.split('_')[1].toUpperCase();
    } else if (category.startsWith('tong_tt_')) {
        setKey = 'TONG_TT_' + category.replace('tong_tt_', '').toUpperCase();
    } else if (category.startsWith('tong_moi_')) {
        setKey = 'TONG_MOI_' + category.replace('tong_moi_', '').toUpperCase();
    } else if (category.startsWith('hieu_')) {
        setKey = 'HIEU_' + category.replace('hieu_', '').toUpperCase();
    } else if (category.startsWith('dau_dit_tien_')) {
        setKey = 'DAU_DIT_TIEN_' + category.split('_')[3];
    } else if (category === 'chanChan') {
        setKey = 'CHAN_CHAN';
    } else if (category === 'chanLe') {
        setKey = 'CHAN_LE';
    } else if (category === 'leChan') {
        setKey = 'LE_CHAN';
    } else if (category === 'leLe') {
        setKey = 'LE_LE';
    }

    // 1. Try direct lookup
    if (SETS[setKey]) {
        return SETS[setKey].map(n => parseInt(n, 10));
    }

    // 2. Try dynamic group parsing
    const groupPrefixes = [
        { prefix: 'TONG_TT_', max: 10, min: 1 },
        { prefix: 'TONG_MOI_', max: 18, min: 0 },
        { prefix: 'HIEU_', max: 9, min: 0 }
    ];

    for (const config of groupPrefixes) {
        const { prefix, max, min } = config;
        if (setKey.startsWith(prefix)) {
            const suffix = setKey.replace(prefix, '');
            if (suffix.includes('_')) {
                const parts = suffix.split('_').map(p => parseInt(p, 10));
                let targetNums = [];

                if (parts.length === 2) {
                    const start = parts[0];
                    const end = parts[1];
                    let current = start;
                    while (current !== end) {
                        targetNums.push(current);
                        current++;
                        if (current > max) current = min;
                    }
                    targetNums.push(end);
                } else {
                    targetNums = parts;
                }

                let combinedNums = [];
                for (const num of targetNums) {
                    const individualKey = prefix + num;
                    if (SETS[individualKey]) {
                        combinedNums = [...combinedNums, ...SETS[individualKey]];
                    }
                }

                if (combinedNums.length > 0) {
                    return [...new Set(combinedNums)].map(n => parseInt(n, 10));
                }
            }
        }
    }

    return [];
}

function getAllGreaterOrSmaller(currentValue, numberSet, isProgressive, wrap = true) {
    const sortedSet = [...numberSet].sort((a, b) => parseInt(a) - parseInt(b));
    const currentIndex = sortedSet.indexOf(currentValue);

    if (currentIndex === -1) return [];

    let result = [];
    if (isProgressive) {
        const greater = sortedSet.slice(currentIndex + 1);
        if (greater.length === 0 && wrap) {
            result = sortedSet.slice(0, currentIndex);
        } else {
            result = greater;
        }
    } else {
        const smaller = sortedSet.slice(0, currentIndex);
        if (smaller.length === 0 && wrap) {
            result = sortedSet.slice(currentIndex + 1);
        } else {
            result = smaller;
        }
    }

    return result.filter(v => v !== currentValue);
}

function predictNextInSequence(stat, category, subcategory) {
    let lastValue = null;
    if (stat.current.values && stat.current.values.length > 0) {
        lastValue = stat.current.values[stat.current.values.length - 1];
    } else if (stat.current.value) {
        lastValue = stat.current.value;
    } else {
        return [];
    }

    const isProgressive = subcategory.includes('tien');
    const isUniform = subcategory.includes('Deu');
    const isDongTien = subcategory === 'dongTien';
    const isDongLui = subcategory === 'dongLui';

    const getSequence = (cat) => {
        if (cat.startsWith('tong_tt_')) {
            const suffix = cat.replace('tong_tt_', '');
            if (suffix === 'cac_tong') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            if (suffix.includes('_')) {
                if (suffix === 'chan') return ['2', '4', '6', '8', '10'];
                if (suffix === 'le') return ['1', '3', '5', '7', '9'];
                if (suffix === 'chan_chan') return ['2', '4', '6', '8', '10'];
                if (suffix === 'chan_le') return ['1', '3', '5', '7', '9'];
                const parts = suffix.split('_').map(n => parseInt(n));
                if (parts.length >= 2) {
                    const fullSeq = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                    const start = parts[0];
                    const end = parts[parts.length - 1];
                    if (start < end) {
                        return fullSeq.filter(n => n >= start && n <= end).map(String);
                    } else {
                        return [...fullSeq.filter(n => n >= start), ...fullSeq.filter(n => n <= end)].map(String);
                    }
                }
            }
            return [suffix];
        }

        if (cat.startsWith('tong_moi_')) {
            const suffix = cat.replace('tong_moi_', '');
            if (suffix === 'cac_tong') return Array.from({ length: 19 }, (_, i) => String(i));
            if (suffix.includes('_')) {
                if (suffix === 'chan') return Array.from({ length: 10 }, (_, i) => String(i * 2));
                if (suffix === 'le') return Array.from({ length: 9 }, (_, i) => String(i * 2 + 1));
                const parts = suffix.split('_').map(n => parseInt(n));
                if (parts.length >= 2) {
                    const fullSeq = Array.from({ length: 19 }, (_, i) => i);
                    const start = parts[0];
                    const end = parts[parts.length - 1];
                    if (start < end) {
                        return fullSeq.filter(n => n >= start && n <= end).map(String);
                    } else {
                        return [...fullSeq.filter(n => n >= start), ...fullSeq.filter(n => n <= end)].map(String);
                    }
                }
            }
            return [suffix];
        }

        if (cat.startsWith('hieu_')) {
            const suffix = cat.replace('hieu_', '');
            if (suffix === 'cac_hieu') return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            if (suffix.includes('_')) {
                if (suffix === 'chan') return ['0', '2', '4', '6', '8'];
                if (suffix === 'le') return ['1', '3', '5', '7', '9'];
                const parts = suffix.split('_').map(n => parseInt(n));
                if (parts.length >= 2) {
                    const fullSeq = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
                    const start = parts[0];
                    const end = parts[parts.length - 1];
                    if (start < end) {
                        return fullSeq.filter(n => n >= start && n <= end).map(String);
                    } else {
                        return [...fullSeq.filter(n => n >= start), ...fullSeq.filter(n => n <= end)].map(String);
                    }
                }
            }
            return [suffix];
        }

        if (cat === 'dau_nho' || cat === 'dit_nho') return ['0', '1', '2', '3', '4'];
        if (cat === 'dau_to' || cat === 'dit_to') return ['5', '6', '7', '8', '9'];
        if (cat === 'dau_chan' || cat === 'dit_chan') return ['0', '2', '4', '6', '8'];
        if (cat === 'dau_le' || cat === 'dit_le') return ['1', '3', '5', '7', '9'];

        if (cat.includes('lon_hon_') || cat.includes('nho_hon_')) {
            if (cat.includes('dau_le_lon_hon_5')) return ['7', '9'];
            if (cat.includes('dau_le_nho_hon_5')) return ['1', '3'];
            if (cat.includes('dau_chan_lon_hon_4')) return ['6', '8'];
            if (cat.includes('dau_chan_nho_hon_4')) return ['0', '2'];
            if (cat.includes('dit_le_lon_hon_5')) return ['7', '9'];
            if (cat.includes('dit_le_nho_hon_5')) return ['1', '3'];
            if (cat.includes('dit_chan_lon_hon_4')) return ['6', '8'];
            if (cat.includes('dit_chan_nho_hon_4')) return ['0', '2'];
        }

        // Composite patterns - these track 2-digit numbers, not individual digits
        // Basic composite patterns
        if (cat === 'chanChan') return SETS['CHAN_CHAN'] || [];
        if (cat === 'chanLe') return SETS['CHAN_LE'] || [];
        if (cat === 'leChan') return SETS['LE_CHAN'] || [];
        if (cat === 'leLe') return SETS['LE_LE'] || [];

        // Size-based composite patterns
        if (cat === 'dau_nho_dit_nho') return SETS['DAU_NHO_DIT_NHO'] || [];
        if (cat === 'dau_nho_dit_to') return SETS['DAU_NHO_DIT_TO'] || [];
        if (cat === 'dau_to_dit_nho') return SETS['DAU_TO_DIT_NHO'] || [];
        if (cat === 'dau_to_dit_to') return SETS['DAU_TO_DIT_TO'] || [];

        // Complex conditional composite patterns
        if (cat === 'dau_chan_lon_4_dit_chan_lon_4') return SETS['DAU_CHAN_LON_4_DIT_CHAN_LON_4'] || [];
        if (cat === 'dau_chan_lon_4_dit_chan_nho_4') return SETS['DAU_CHAN_LON_4_DIT_CHAN_NHO_4'] || [];
        if (cat === 'dau_chan_nho_4_dit_chan_lon_4') return SETS['DAU_CHAN_NHO_4_DIT_CHAN_LON_4'] || [];
        if (cat === 'dau_chan_nho_4_dit_chan_nho_4') return SETS['DAU_CHAN_NHO_4_DIT_CHAN_NHO_4'] || [];
        if (cat === 'dau_chan_lon_4_dit_le_lon_5') return SETS['DAU_CHAN_LON_4_DIT_LE_LON_5'] || [];
        if (cat === 'dau_chan_lon_4_dit_le_nho_5') return SETS['DAU_CHAN_LON_4_DIT_LE_NHO_5'] || [];
        if (cat === 'dau_chan_nho_4_dit_le_lon_5') return SETS['DAU_CHAN_NHO_4_DIT_LE_LON_5'] || [];
        if (cat === 'dau_chan_nho_4_dit_le_nho_5') return SETS['DAU_CHAN_NHO_4_DIT_LE_NHO_5'] || [];
        if (cat === 'dau_le_lon_5_dit_chan_lon_4') return SETS['DAU_LE_LON_5_DIT_CHAN_LON_4'] || [];
        if (cat === 'dau_le_lon_5_dit_chan_nho_4') return SETS['DAU_LE_LON_5_DIT_CHAN_NHO_4'] || [];
        if (cat === 'dau_le_nho_5_dit_chan_lon_4') return SETS['DAU_LE_NHO_5_DIT_CHAN_LON_4'] || [];
        if (cat === 'dau_le_nho_5_dit_chan_nho_4') return SETS['DAU_LE_NHO_5_DIT_CHAN_NHO_4'] || [];
        if (cat === 'dau_le_lon_5_dit_le_lon_5') return SETS['DAU_LE_LON_5_DIT_LE_LON_5'] || [];
        if (cat === 'dau_le_lon_5_dit_le_nho_5') return SETS['DAU_LE_LON_5_DIT_LE_NHO_5'] || [];
        if (cat === 'dau_le_nho_5_dit_le_lon_5') return SETS['DAU_LE_NHO_5_DIT_LE_LON_5'] || [];
        if (cat === 'dau_le_nho_5_dit_le_nho_5') return SETS['DAU_LE_NHO_5_DIT_LE_NHO_5'] || [];

        // Specific digit composite patterns
        if (cat === 'dau_4_dit_chan_lon_4') return SETS['DAU_4_DIT_CHAN_LON_4'] || [];
        if (cat === 'dau_4_dit_chan_nho_4') return SETS['DAU_4_DIT_CHAN_NHO_4'] || [];
        if (cat === 'dau_4_dit_le_lon_5') return SETS['DAU_4_DIT_LE_LON_5'] || [];
        if (cat === 'dau_4_dit_le_nho_5') return SETS['DAU_4_DIT_LE_NHO_5'] || [];
        if (cat === 'dau_5_dit_chan_lon_4') return SETS['DAU_5_DIT_CHAN_LON_4'] || [];
        if (cat === 'dau_5_dit_chan_nho_4') return SETS['DAU_5_DIT_CHAN_NHO_4'] || [];
        if (cat === 'dau_5_dit_le_lon_5') return SETS['DAU_5_DIT_LE_LON_5'] || [];
        if (cat === 'dau_5_dit_le_nho_5') return SETS['DAU_5_DIT_LE_NHO_5'] || [];
        if (cat === 'dit_4_dau_chan_lon_4') return SETS['DIT_4_DAU_CHAN_LON_4'] || [];
        if (cat === 'dit_4_dau_chan_nho_4') return SETS['DIT_4_DAU_CHAN_NHO_4'] || [];
        if (cat === 'dit_4_dau_le_lon_5') return SETS['DIT_4_DAU_LE_LON_5'] || [];
        if (cat === 'dit_4_dau_le_nho_5') return SETS['DIT_4_DAU_LE_NHO_5'] || [];
        if (cat === 'dit_5_dau_chan_lon_4') return SETS['DIT_5_DAU_CHAN_LON_4'] || [];
        if (cat === 'dit_5_dau_chan_nho_4') return SETS['DIT_5_DAU_CHAN_NHO_4'] || [];
        if (cat === 'dit_5_dau_le_lon_5') return SETS['DIT_5_DAU_LE_LON_5'] || [];
        if (cat === 'dit_5_dau_le_nho_5') return SETS['DIT_5_DAU_LE_NHO_5'] || [];

        if (cat.startsWith('dau_dit_tien_')) {
            const setKey = 'DAU_DIT_TIEN_' + cat.split('_')[3];
            return SETS[setKey] || [];
        }

        if (cat.startsWith('dau_') && !cat.includes('_')) return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        if (cat.startsWith('dit_') && !cat.includes('_')) return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        return null;
    };

    const extractValue = (val, cat) => {
        const strVal = String(val).padStart(2, '0');

        // ALL composite patterns use full 2-digit number
        const compositePatterns = [
            'chanChan', 'chanLe', 'leChan', 'leLe',
            'dau_nho_dit_nho', 'dau_nho_dit_to', 'dau_to_dit_nho', 'dau_to_dit_to',
            'dau_chan_lon_4_dit_chan_lon_4', 'dau_chan_lon_4_dit_chan_nho_4',
            'dau_chan_nho_4_dit_chan_lon_4', 'dau_chan_nho_4_dit_chan_nho_4',
            'dau_chan_lon_4_dit_le_lon_5', 'dau_chan_lon_4_dit_le_nho_5',
            'dau_chan_nho_4_dit_le_lon_5', 'dau_chan_nho_4_dit_le_nho_5',
            'dau_le_lon_5_dit_chan_lon_4', 'dau_le_lon_5_dit_chan_nho_4',
            'dau_le_nho_5_dit_chan_lon_4', 'dau_le_nho_5_dit_chan_nho_4',
            'dau_le_lon_5_dit_le_lon_5', 'dau_le_lon_5_dit_le_nho_5',
            'dau_le_nho_5_dit_le_lon_5', 'dau_le_nho_5_dit_le_nho_5',
            'dau_4_dit_chan_lon_4', 'dau_4_dit_chan_nho_4', 'dau_4_dit_le_lon_5', 'dau_4_dit_le_nho_5',
            'dau_5_dit_chan_lon_4', 'dau_5_dit_chan_nho_4', 'dau_5_dit_le_lon_5', 'dau_5_dit_le_nho_5',
            'dit_4_dau_chan_lon_4', 'dit_4_dau_chan_nho_4', 'dit_4_dau_le_lon_5', 'dit_4_dau_le_nho_5',
            'dit_5_dau_chan_lon_4', 'dit_5_dau_chan_nho_4', 'dit_5_dau_le_lon_5', 'dit_5_dau_le_nho_5'
        ];

        if (compositePatterns.includes(cat)) return strVal;
        if (cat.startsWith('dau_dit_tien_')) return strVal;
        if (cat.startsWith('tong_tt_')) return String(getTongTT(strVal));
        if (cat.startsWith('tong_moi_')) return String(getTongMoi(strVal));
        if (cat.startsWith('hieu_')) return String(getHieu(strVal));
        if (cat.startsWith('dau_')) return strVal[0];
        if (cat.startsWith('dit_')) return strVal[1];
        return strVal;
    };

    const lastValueToPredict = extractValue(lastValue, category);
    let nextValues = [];
    const numberSet = getSequence(category);

    if (numberSet) {
        const indexMap = new Map(numberSet.map((v, i) => [v, i]));

        if (isUniform) {
            const val = isProgressive
                ? findNextInSet(lastValueToPredict, numberSet, indexMap)
                : findPreviousInSet(lastValueToPredict, numberSet, indexMap);
            if (val !== null) nextValues.push(val);
        } else if (isDongTien || isDongLui) {
            nextValues = getAllGreaterOrSmaller(lastValueToPredict, numberSet, isDongTien, false);
        } else {
            if (category.startsWith('dau_dit_tien_')) {
                nextValues = getAllGreaterOrSmaller(lastValueToPredict, numberSet, isProgressive, false);
            } else {
                nextValues = getAllGreaterOrSmaller(lastValueToPredict, numberSet, isProgressive);
            }
        }
    } else {
        return getNumbersFromCategory(category);
    }

    const resultNumbers = [];

    // Định nghĩa composite patterns để check
    const compositePatterns = [
        'chanChan', 'chanLe', 'leChan', 'leLe',
        'dau_nho_dit_nho', 'dau_nho_dit_to', 'dau_to_dit_nho', 'dau_to_dit_to',
        'dau_chan_lon_4_dit_chan_lon_4', 'dau_chan_lon_4_dit_chan_nho_4',
        'dau_chan_nho_4_dit_chan_lon_4', 'dau_chan_nho_4_dit_chan_nho_4',
        'dau_chan_lon_4_dit_le_lon_5', 'dau_chan_lon_4_dit_le_nho_5',
        'dau_chan_nho_4_dit_le_lon_5', 'dau_chan_nho_4_dit_le_nho_5',
        'dau_le_lon_5_dit_chan_lon_4', 'dau_le_lon_5_dit_chan_nho_4',
        'dau_le_nho_5_dit_chan_lon_4', 'dau_le_nho_5_dit_chan_nho_4',
        'dau_le_lon_5_dit_le_lon_5', 'dau_le_lon_5_dit_le_nho_5',
        'dau_le_nho_5_dit_le_lon_5', 'dau_le_nho_5_dit_le_nho_5',
        'dau_4_dit_chan_lon_4', 'dau_4_dit_chan_nho_4', 'dau_4_dit_le_lon_5', 'dau_4_dit_le_nho_5',
        'dau_5_dit_chan_lon_4', 'dau_5_dit_chan_nho_4', 'dau_5_dit_le_lon_5', 'dau_5_dit_le_nho_5',
        'dit_4_dau_chan_lon_4', 'dit_4_dau_chan_nho_4', 'dit_4_dau_le_lon_5', 'dit_4_dau_le_nho_5',
        'dit_5_dau_chan_lon_4', 'dit_5_dau_chan_nho_4', 'dit_5_dau_le_lon_5', 'dit_5_dau_le_nho_5'
    ];

    for (const nextVal of nextValues) {
        if (category.startsWith('tong_tt_')) {
            const targetSum = parseInt(nextVal, 10);
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => getTongTT(String(n).padStart(2, '0')) === targetSum));
        } else if (category.startsWith('tong_moi_')) {
            const targetSum = parseInt(nextVal, 10);
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => getTongMoi(String(n).padStart(2, '0')) === targetSum));
        } else if (category.startsWith('hieu_')) {
            const targetDiff = parseInt(nextVal, 10);
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => getHieu(String(n).padStart(2, '0')) === targetDiff));
        } else if (category.startsWith('dau_dit_tien_')) {
            resultNumbers.push(parseInt(nextVal, 10));
        }
        // Với Composite patterns - CHECK TRƯỚC dau_/dit_ để tránh match nhầm
        else if (compositePatterns.includes(category)) {
            resultNumbers.push(parseInt(nextVal, 10));
        }
        // Với Đầu/Đít đơn lẻ (PHẢI sau composite patterns)
        else if (category.startsWith('dau_')) {
            const targetDigit = nextVal;
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => String(n).padStart(2, '0')[0] === targetDigit));
        } else if (category.startsWith('dit_')) {
            const targetDigit = nextVal;
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => String(n).padStart(2, '0')[1] === targetDigit));
        }
        // Với Composite patterns - nextVal đã là số 2 chữ số
        else {
            const compositePatterns = [
                'chanChan', 'chanLe', 'leChan', 'leLe',
                'dau_nho_dit_nho', 'dau_nho_dit_to', 'dau_to_dit_nho', 'dau_to_dit_to',
                'dau_chan_lon_4_dit_chan_lon_4', 'dau_chan_lon_4_dit_chan_nho_4',
                'dau_chan_nho_4_dit_chan_lon_4', 'dau_chan_nho_4_dit_chan_nho_4',
                'dau_chan_lon_4_dit_le_lon_5', 'dau_chan_lon_4_dit_le_nho_5',
                'dau_chan_nho_4_dit_le_lon_5', 'dau_chan_nho_4_dit_le_nho_5',
                'dau_le_lon_5_dit_chan_lon_4', 'dau_le_lon_5_dit_chan_nho_4',
                'dau_le_nho_5_dit_chan_lon_4', 'dau_le_nho_5_dit_chan_nho_4',
                'dau_le_lon_5_dit_le_lon_5', 'dau_le_lon_5_dit_le_nho_5',
                'dau_le_nho_5_dit_le_lon_5', 'dau_le_nho_5_dit_le_nho_5',
                'dau_4_dit_chan_lon_4', 'dau_4_dit_chan_nho_4', 'dau_4_dit_le_lon_5', 'dau_4_dit_le_nho_5',
                'dau_5_dit_chan_lon_4', 'dau_5_dit_chan_nho_4', 'dau_5_dit_le_lon_5', 'dau_5_dit_le_nho_5',
                'dit_4_dau_chan_lon_4', 'dit_4_dau_chan_nho_4', 'dit_4_dau_le_lon_5', 'dit_4_dau_le_nho_5',
                'dit_5_dau_chan_lon_4', 'dit_5_dau_chan_nho_4', 'dit_5_dau_le_lon_5', 'dit_5_dau_le_nho_5'
            ];
            if (compositePatterns.includes(category)) {
                resultNumbers.push(parseInt(nextVal, 10));
            }
        }
    }

    if (resultNumbers.length > 0) {
        return [...new Set(resultNumbers)];
    }

    return getNumbersFromCategory(category);
}

/**
 * Main function to get exclusions for a specific date
 * Uses getQuickStats() to ensure 100% alignment with suggestionsController
 */
async function getExclusions(lotteryData, currentIndex, globalStats) {
    const excludedNumbers = new Set();

    // Use getQuickStats() just like suggestionsController does
    const quickStats = await statisticsService.getQuickStats();

    for (const key in quickStats) {
        const stat = quickStats[key];

        // Skip if no current streak
        if (!stat.current) continue;

        const currentLen = stat.current.length;
        const [category, subcategory] = key.split(':');
        const isSoLePattern = subcategory === 'veSole' || subcategory === 'veSoleMoi';
        const isTrendPattern = subcategory === 'tienDeuLienTiep' || subcategory === 'luiDeuLienTiep' ||
            subcategory === 'tienLienTiep' || subcategory === 'luiLienTiep';

        const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;
        const gapInfo = stat.gapStats ? stat.gapStats[targetLen] : null;
        const recordLen = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;

        let shouldExclude = false;

        // 1. Check if reached record
        if (currentLen >= recordLen && recordLen > 0) {
            shouldExclude = true;
        }
        // 1.5. Check if near record (>= 80%)
        else if (currentLen >= recordLen * 0.8 && recordLen > 2) {
            shouldExclude = true;
        }
        // 2. Check gap rules
        else if (gapInfo) {
            // Check minGap condition
            if (gapInfo.minGap !== null && gapInfo.lastGap < gapInfo.minGap) {
                shouldExclude = true;
            }
            // Check avgGap condition (parallel, not else-if)
            else if (gapInfo.avgGap > 0 && gapInfo.lastGap < 0.15 * gapInfo.avgGap) {
                shouldExclude = true;
            }
        }

        if (shouldExclude) {
            // Resolve numbers using the same logic as suggestionsController
            let nums = [];

            if (isTrendPattern) {
                nums = predictNextInSequence(stat, category, subcategory);
            }
            else if (subcategory === 'veLienTiep' || subcategory === 'veCungGiaTri') {
                // Standard repetition logic
                if (category.startsWith('dau_')) {
                    const digit = category.split('_')[1];
                    nums = Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => String(n).padStart(2, '0')[0] === digit);
                } else if (category.startsWith('dit_')) {
                    const digit = category.split('_')[1];
                    nums = Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => String(n).padStart(2, '0')[1] === digit);
                } else if (category.startsWith('tong_tt_') || category.startsWith('tong_moi_') || category.startsWith('hieu_')) {
                    nums = getNumbersFromCategory(category);
                } else if (stat.current.value) {
                    nums = [parseInt(stat.current.value, 10)];
                } else if (stat.current.values && stat.current.values.length > 0) {
                    nums = stat.current.values.map(v => parseInt(v, 10));
                } else {
                    nums = getNumbersFromCategory(category);
                }
            }
            else if (isSoLePattern) {
                // So Le logic - expand values
                let valuesToExclude = [];
                if (stat.current.value) {
                    valuesToExclude = [stat.current.value];
                } else if (stat.current.values && stat.current.values.length > 0) {
                    valuesToExclude = stat.current.values;
                }

                if (category.startsWith('tong_') || category.startsWith('hieu_') ||
                    category.startsWith('dau_') || category.startsWith('dit_')) {

                    for (const val of valuesToExclude) {
                        let tempCategory = '';
                        if (category.startsWith('tong_tt_')) tempCategory = `tong_tt_${val} `;
                        else if (category.startsWith('tong_moi_')) tempCategory = `tong_moi_${val} `;
                        else if (category.startsWith('hieu_')) tempCategory = `hieu_${val} `;
                        else if (category.startsWith('dau_')) tempCategory = `dau_${val} `;
                        else if (category.startsWith('dit_')) tempCategory = `dit_${val} `;

                        if (tempCategory) {
                            const expandedNums = getNumbersFromCategory(tempCategory);
                            nums = [...nums, ...expandedNums];
                        }
                    }
                    nums = [...new Set(nums)];
                } else {
                    nums = valuesToExclude.map(v => parseInt(v, 10));
                }
            }
            else {
                // Fallback
                nums = getNumbersFromCategory(category);
            }

            // Fallback if still empty
            if (nums.length === 0) {
                nums = getNumbersFromCategory(category);
            }

            // Filter out null, undefined, and NaN values (CRITICAL - matches suggestionsController)
            if (nums.length > 0) {
                nums = nums.filter(n => n !== null && n !== undefined && !isNaN(n) && typeof n === 'number');
            }

            if (nums.length > 0) {
                nums.forEach(n => excludedNumbers.add(n));
            }
        }
    }

    return excludedNumbers;
}

module.exports = {
    getExclusions
};
