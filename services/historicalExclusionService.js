/**
 * historicalExclusionService.js
 *
 * Tính toán số loại trừ (Exclusion & Exclusion+) cho BẤT KỲ NGÀY LỊCH SỬ NÀO.
 * 
 * Chiến lược: Filter pre-computed streak JSON files theo ngày → compute quickStats
 * at-point-in-time → áp dụng logic của suggestionsController (freq ≤ 1.5).
 *
 * Dùng cho: backtest và future simulation.
 */

const fs = require('fs');
const path = require('path');

const HEAD_TAIL_STATS_PATH = path.join(__dirname, '../data/statistics/head_tail_stats.json');
const SUM_DIFF_STATS_PATH = path.join(__dirname, '../data/statistics/sum_difference_stats.json');
const NUMBER_STATS_PATH = path.join(__dirname, '../data/statistics/number_stats.json');

const { SETS, findNextInSet, findPreviousInSet, INDEX_MAPS, identifyCategories } = require('../utils/numberAnalysis');
const { getNumbersFromCategory } = require('../controllers/suggestionsController');

const MAX_BET_COUNT = 65;

// ==== CACHE ====
let _allStats = null;
const _dateCache = new Map();

function loadAllStats() {
    if (_allStats) return _allStats;
    try {
        const headTail = JSON.parse(fs.readFileSync(HEAD_TAIL_STATS_PATH, 'utf8'));
        const sumDiff = JSON.parse(fs.readFileSync(SUM_DIFF_STATS_PATH, 'utf8'));
        const number = JSON.parse(fs.readFileSync(NUMBER_STATS_PATH, 'utf8'));
        _allStats = { ...headTail, ...sumDiff, ...number };
        return _allStats;
    } catch (e) {
        console.error('[HistoricalExclusion] Lỗi load stats:', e.message);
        return {};
    }
}

// ==== DATE HELPERS ====
function parseDate(str) {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

function formatDate(d) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ==== COMPUTE quickStats FOR A SPECIFIC DATE ====
/**
 * Tính quickStats cho một ngày cụ thể (chỉ dùng dữ liệu lịch sử đến trước ngày đó)
 * @param {string} targetDateStr - 'dd/mm/yyyy'
 * @param {number} totalYears
 * @returns {Object} quickStats object (tương tự statisticsService.getQuickStats())
 */
function computeQuickStatsForDate(targetDateStr, totalYears) {
    const allStats = loadAllStats();
    const targetDate = parseDate(targetDateStr);
    if (!targetDate) return {};

    // Ngày có kết quả cuối cùng (ngày hôm qua so với ngày cần dự đoán)
    const prevDate = new Date(targetDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = formatDate(prevDate);

    const quickStats = {};

    const analyzeCategory = (key, categoryData) => {
        if (!categoryData || !Array.isArray(categoryData.streaks) || categoryData.streaks.length === 0) {
            return;
        }

        // Chỉ lấy các chuỗi kết thúc TRƯỚC ngày cần dự đoán (< targetDate)
        const historicalStreaks = categoryData.streaks.filter(s => {
            const endDate = parseDate(s.endDate);
            return endDate && endDate < targetDate;
        });

        if (historicalStreaks.length === 0) return;

        const streaks = [...historicalStreaks].sort((a, b) => b.length - a.length);
        const longestLength = streaks[0].length;
        const longest = streaks.filter(s => s.length === longestLength);

        let secondLongest = [];
        for (let i = 0; i < streaks.length; i++) {
            if (streaks[i].length < longestLength) {
                const secondLength = streaks[i].length;
                secondLongest = streaks.filter(s => s.length === secondLength);
                break;
            }
        }

        // Xác định loại pattern
        const lowerKey = key.toLowerCase();
        const isSoLePattern = (lowerKey.includes('sole') || lowerKey.includes('solemoi')) &&
            !key.includes('tienLuiSoLe') && !key.includes('luiTienSoLe');
        const isTienLuiSoLe = key.includes('tienLuiSoLe') || key.includes('luiTienSoLe');

        // Tìm chuỗi đang diễn ra tại ngày cần dự đoán
        let current = null;
        if (isSoLePattern) {
            // So le: chuỗi kết thúc ngày hôm qua
            current = historicalStreaks.find(s => s.endDate === prevDateStr);
        } else if (isTienLuiSoLe) {
            current = historicalStreaks.find(s => s.endDate === prevDateStr && s.length >= 4);
        } else {
            // Các dạng khác: chuỗi kết thúc ngày hôm qua
            current = historicalStreaks.find(s => s.endDate === prevDateStr) || null;
        }

        // Tính exactGapStats (dùng để xác định freq)
        const exactGapStats = {};
        const maxLen = longestLength;
        const calcLimit = maxLen + 1;

        for (let len = 2; len <= calcLimit; len++) {
            const exactStreaks = historicalStreaks.filter(s => s.length === len);
            exactGapStats[len] = { count: exactStreaks.length, pastCount: exactStreaks.length };
        }

        // Tính computedMaxStreak (freq <= 1.5)
        let startLen = 2;
        let increment = 1;
        if (isSoLePattern) { startLen = 3; increment = 2; }
        else if (isTienLuiSoLe) { startLen = 4; increment = 1; }

        let computedMaxStreak = longestLength;
        let isSuperMaxThreshold = false;
        for (let len = startLen; len <= calcLimit; len += increment) {
            const cnt = exactGapStats[len] ? exactGapStats[len].count : 0;
            const freqYear = totalYears > 0 ? cnt / totalYears : 0;
            if (freqYear <= 1.5) {
                computedMaxStreak = len;
                isSuperMaxThreshold = freqYear <= 0.5;
                break;
            }
        }

        quickStats[key] = {
            description: categoryData.description,
            longest,
            secondLongest,
            current,
            computedMaxStreak,
            isSuperMaxThreshold,
            exactGapStats,
            gapStats: exactGapStats // Dùng exactGapStats cho cả gapStats (đủ cho freq calc)
        };
    };

    for (const key in allStats) {
        const categoryData = allStats[key];
        if (categoryData && Array.isArray(categoryData.streaks)) {
            analyzeCategory(key, categoryData);
        } else if (categoryData && typeof categoryData === 'object') {
            for (const subKey in categoryData) {
                const sub = categoryData[subKey];
                if (sub && Array.isArray(sub.streaks)) {
                    analyzeCategory(`${key}:${subKey}`, sub);
                }
            }
        }
    }

    quickStats._meta = { totalYears };
    return quickStats;
}

// ==== PORT predictNextInSequence từ suggestionsController ====
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

    if (category === 'tienLuiSoLe' || category === 'luiTienSoLe') {
        if (stat.current.values && stat.current.values.length >= 2) {
            const values = stat.current.values;
            const lastVal = parseInt(values[values.length - 1], 10);
            const prevVal = parseInt(values[values.length - 2], 10);
            const isTien = lastVal > prevVal;
            if (isTien) return Array.from({ length: 100 }, (_, i) => i).filter(n => n <= lastVal);
            else return Array.from({ length: 100 }, (_, i) => i).filter(n => n >= lastVal);
        }
        return [];
    }

    // Helper: Extract giá trị từ 2-digit number cho category
    const extractVal = (numStr, cat) => {
        const n = parseInt(numStr, 10);
        if (isNaN(n)) return null;
        const s = String(n).padStart(2, '0');
        const d0 = parseInt(s[0], 10);
        const d1 = parseInt(s[1], 10);

        if (cat.startsWith('dau_')) return d0; // đầu
        if (cat.startsWith('dit_')) return d1; // đít
        if (cat.startsWith('tong_tt_')) {
            const sum = d0 + d1;
            return sum === 0 ? 10 : (sum % 10 === 0 ? 10 : sum % 10);
        }
        if (cat.startsWith('tong_moi_')) return d0 + d1; // tổng mới 0-18
        if (cat.startsWith('hieu_')) return Math.abs(d0 - d1); // hiệu 0-9
        return null;
    };

    // Xác định sequence
    const getSeq = (cat) => {
        if (cat.startsWith('dau_')) {
            const suffix = cat.replace('dau_', '');
            if (suffix === 'chan') return ['0', '2', '4', '6', '8'];
            if (suffix === 'le') return ['1', '3', '5', '7', '9'];
            if (suffix === 'nho') return ['0', '1', '2', '3', '4'];
            if (suffix === 'to') return ['5', '6', '7', '8', '9'];
            return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']; // General dau
        }
        if (cat.startsWith('dit_')) {
            const suffix = cat.replace('dit_', '');
            if (suffix === 'chan') return ['0', '2', '4', '6', '8'];
            if (suffix === 'le') return ['1', '3', '5', '7', '9'];
            if (suffix === 'nho') return ['0', '1', '2', '3', '4'];
            if (suffix === 'to') return ['5', '6', '7', '8', '9'];
            return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']; // General dit
        }
        if (cat.startsWith('tong_tt_')) {
            const s = cat.replace('tong_tt_', '');
            if (s === 'cac_tong') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            if (s === 'chan') return ['2', '4', '6', '8', '10'];
            if (s === 'le') return ['1', '3', '5', '7', '9'];
            // For range like 5_7, chan_le, etc. → tổng TT sequence chung
            return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        }
        if (cat.startsWith('tong_moi_')) {
            const s = cat.replace('tong_moi_', '');
            if (s === 'cac_tong') return Array.from({ length: 19 }, (_, i) => String(i));
            if (s === 'chan') return Array.from({ length: 10 }, (_, i) => String(i * 2));
            if (s === 'le') return Array.from({ length: 9 }, (_, i) => String(i * 2 + 1));
            return Array.from({ length: 19 }, (_, i) => String(i)); // General tong_moi
        }
        if (cat.startsWith('hieu_')) {
            const s = cat.replace('hieu_', '');
            if (s === 'cac_hieu') return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            if (s === 'chan') return ['0', '2', '4', '6', '8'];
            if (s === 'le') return ['1', '3', '5', '7', '9'];
            return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']; // General hieu
        }
        return null;
    };

    const sequence = getSeq(category);
    if (!sequence) return [];

    // Extract derived value for lookup in sequence
    const derivedVal = extractVal(String(lastValue), category);
    const seqMap = new Map(sequence.map((v, i) => [v, i]));

    // Try both derived value and raw value for lookup
    let idx = undefined;
    if (derivedVal !== null) {
        idx = seqMap.get(String(derivedVal));
    }
    if (idx === undefined) {
        const lastStr = String(lastValue);
        idx = seqMap.get(lastStr) ?? seqMap.get(lastStr.padStart(2, '0')) ?? seqMap.get(String(parseInt(lastStr, 10)));
    }

    if (idx === undefined) return [];

    // Tìm giá trị tiếp theo
    const targetSeqValue = isProgressive
        ? sequence[(idx + 1) % sequence.length]
        : sequence[(idx - 1 + sequence.length) % sequence.length];

    const targetNum = parseInt(targetSeqValue, 10);

    // Map giá trị target về các số 2 chữ số
    if (category.startsWith('dau_')) {
        return Array.from({ length: 100 }, (_, i) => i).filter(n => Math.floor(n / 10) === targetNum);
    }
    if (category.startsWith('dit_')) {
        return Array.from({ length: 100 }, (_, i) => i).filter(n => n % 10 === targetNum);
    }
    if (category.startsWith('tong_tt_')) {
        const setKey = `TONG_TT_${targetNum}`;
        if (SETS[setKey]) return SETS[setKey].map(n => parseInt(n, 10));
    }
    if (category.startsWith('tong_moi_')) {
        const setKey = `TONG_MOI_${targetNum}`;
        if (SETS[setKey]) return SETS[setKey].map(n => parseInt(n, 10));
    }
    if (category.startsWith('hieu_')) {
        const setKey = `HIEU_${targetNum}`;
        if (SETS[setKey]) return SETS[setKey].map(n => parseInt(n, 10));
    }

    return [];
}

// ==== PORT addExcludedNumber từ suggestionsController ====
function resolveExcludedNumbers(stat, key) {
    let nums = [];
    let category, subcategory;

    let cleanKey = key.replace(/^\[TIỀM NĂNG\]\s*/, '');

    if (cleanKey.includes(':')) {
        [category, subcategory] = cleanKey.split(':');
    } else {
        const patterns = [
            'LuiDeuLienTiep', 'TienDeuLienTiep',
            'LuiLienTiep', 'TienLienTiep',
            'LuiDeu', 'TienDeu',
            'VeLienTiep', 'VeCungGiaTri', 'VeSole', 'VeSoleMoi',
            'DongTien', 'DongLui',
            'Lui', 'Tien'
        ];
        for (const pattern of patterns) {
            if (cleanKey.endsWith(pattern)) {
                subcategory = pattern.charAt(0).toLowerCase() + pattern.slice(1);
                category = cleanKey.slice(0, -pattern.length);
                break;
            }
        }
        if (!subcategory) {
            category = cleanKey;
            subcategory = '';
        }
    }

    const trendPatterns = [
        'tienDeuLienTiep', 'luiDeuLienTiep', 'tienLienTiep', 'luiLienTiep',
        'tienDeu', 'luiDeu', 'tien', 'lui'
    ];

    if (trendPatterns.includes(subcategory)) {
        let normalizedSubcategory = subcategory;
        if (subcategory === 'lui') normalizedSubcategory = 'luiLienTiep';
        else if (subcategory === 'tien') normalizedSubcategory = 'tienLienTiep';
        else if (subcategory === 'luiDeu') normalizedSubcategory = 'luiDeuLienTiep';
        else if (subcategory === 'tienDeu') normalizedSubcategory = 'tienDeuLienTiep';
        nums = predictNextInSequence(stat, category, normalizedSubcategory);
    }
    else if (subcategory === 'veLienTiep' || subcategory === 'veCungGiaTri') {
        if (category.startsWith('dau_')) {
            const digit = category.split('_')[1];
            if (digit && digit.match(/^\d$/)) {
                nums = Array.from({ length: 100 }, (_, i) => i)
                    .filter(n => String(n).padStart(2, '0')[0] === digit);
            } else {
                nums = getNumbersFromCategory(category);
            }
        } else if (category.startsWith('dit_')) {
            const digit = category.split('_')[1];
            if (digit && digit.match(/^\d$/)) {
                nums = Array.from({ length: 100 }, (_, i) => i)
                    .filter(n => String(n).padStart(2, '0')[1] === digit);
            } else {
                nums = getNumbersFromCategory(category);
            }
        } else if (category.startsWith('tong_tt_') || category.startsWith('tong_moi_') || category.startsWith('hieu_')) {
            const specificSet = getNumbersFromCategory(category);
            if (specificSet && specificSet.length > 0) {
                nums = specificSet;
            } else if (stat.current.values && stat.current.values.length > 0) {
                nums = stat.current.values.map(v => parseInt(v, 10));
            }
        } else {
            if (stat.current.values && stat.current.values.length > 0) {
                nums = stat.current.values.map(v => parseInt(v, 10));
            }
        }
    }
    else if (category === 'tienLuiSoLe' || key === 'tienLuiSoLe' || category === 'luiTienSoLe' || key === 'luiTienSoLe') {
        if (stat.current.values && stat.current.values.length >= 2) {
            const values = stat.current.values;
            const lastValue = parseInt(values[values.length - 1], 10);
            const prevValue = parseInt(values[values.length - 2], 10);
            const isTien = lastValue > prevValue;
            if (isTien) {
                nums = Array.from({ length: 100 }, (_, i) => i).filter(n => n <= lastValue);
            } else {
                nums = Array.from({ length: 100 }, (_, i) => i).filter(n => n >= lastValue);
            }
        }
    }
    else if (subcategory === 'veSole' || subcategory === 'veSoleMoi') {
        const valuesToExclude = stat.current.values || [];
        if (category === 'motDit' || category === 'cacDit') {
            const lastVal = valuesToExclude[valuesToExclude.length - 1];
            if (lastVal !== null && lastVal !== undefined) {
                const dit = String(lastVal).padStart(2, '0')[1];
                nums = Array.from({ length: 100 }, (_, i) => i)
                    .filter(n => String(n).padStart(2, '0')[1] === dit);
            }
        } else if (category === 'motDau' || category === 'cacDau') {
            const lastVal = valuesToExclude[valuesToExclude.length - 1];
            if (lastVal !== null && lastVal !== undefined) {
                const dau = String(lastVal).padStart(2, '0')[0];
                nums = Array.from({ length: 100 }, (_, i) => i)
                    .filter(n => String(n).padStart(2, '0')[0] === dau);
            }
        } else {
            const patternNums = getNumbersFromCategory(category);
            if (patternNums && patternNums.length > 0 && patternNums.length <= 50) {
                nums = patternNums;
            } else if (valuesToExclude.length > 0) {
                nums = valuesToExclude.map(v => parseInt(v, 10));
            }
        }
    }
    else {
        nums = getNumbersFromCategory(category);
    }

    if (!nums || nums.length === 0) {
        nums = getNumbersFromCategory(category);
    }

    if (nums && nums.length > 0) {
        nums = nums.filter(n => n !== null && n !== undefined && !isNaN(n) && typeof n === 'number');
    }

    return nums || [];
}

// ==== MAIN FUNCTION ====
/**
 * Tính exclusions cho một ngày cụ thể dựa trên quickStats lịch sử tại thời điểm đó.
 * @param {string} targetDateStr - 'dd/mm/yyyy'
 * @param {number} totalYears
 * @returns {Object}
 */
function getExclusionsForDate(targetDateStr, totalYears) {
    const quickStats = computeQuickStatsForDate(targetDateStr, totalYears);

    const excluded4 = new Set(); // Exclusion: 4 subTier (achieved, achievedSuper, threshold, superThreshold)
    const excluded3 = new Set(); // Exclusion+: chỉ achieved + achievedSuper + superThreshold (không threshold thường)

    for (const key in quickStats) {
        if (key === '_meta') continue;
        const stat = quickStats[key];
        if (!stat || !stat.current) continue;

        const currentLen = stat.current.length;
        const [category, subcategory] = key.split(':');
        const isSoLePattern = (subcategory && (subcategory.toLowerCase() === 'vesole' || subcategory.toLowerCase() === 'vesolemoi')) &&
            key !== 'tienLuiSoLe' && key !== 'luiTienSoLe';
        const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;

        const recordLen = stat.computedMaxStreak || (stat.longest && stat.longest[0] && stat.longest[0].length) || 0;

        const gapInfoExact = stat.exactGapStats ? stat.exactGapStats[targetLen] : null;
        const targetCount = gapInfoExact ? gapInfoExact.count : 0;
        const targetFreqYear = totalYears > 0 ? targetCount / totalYears : 0;
        const isSuper = targetFreqYear <= 0.5 || stat.isSuperMaxThreshold;

        let shouldExclude = false;
        let subTier = null;

        if (targetFreqYear <= 1.5 || (currentLen >= recordLen && recordLen > 0)) {
            shouldExclude = true;
            if (currentLen >= recordLen && recordLen > 0) {
                subTier = isSuper ? 'achievedSuper' : 'achieved';
            } else if (isSuper) {
                subTier = 'superThreshold';
            } else {
                subTier = 'threshold';
            }
        }

        if (!shouldExclude) continue;

        // Lấy các số bị ảnh hưởng
        const nums = resolveExcludedNumbers(stat, key);
        if (!nums || nums.length === 0) continue;

        nums.forEach(n => {
            excluded4.add(n); // Exclusion: loại tất cả
            // Exclusion+: chỉ loại khi đạt kỷ lục hoặc siêu kỷ lục
            if (subTier === 'achieved' || subTier === 'achievedSuper' || subTier === 'superThreshold') {
                excluded3.add(n);
            }
        });
    }

    const toBet4 = [];
    const toBet3 = [];
    for (let i = 0; i < 100; i++) {
        if (!excluded4.has(i)) toBet4.push(i);
        if (!excluded3.has(i)) toBet3.push(i);
    }

    const skipped = toBet4.length > MAX_BET_COUNT;
    const skippedPlus = toBet3.length > MAX_BET_COUNT;

    return {
        toBet: skipped ? [] : toBet4,
        toBetPlus: skippedPlus ? [] : toBet3,
        excluded: Array.from(excluded4),
        excludedPlus: Array.from(excluded3),
        skipped,
        skippedPlus,
        totalBet4: toBet4.length,
        totalBet3: toBet3.length
    };
}

/**
 * Phiên bản cache - dùng cho backtest nhiều ngày
 */
function getExclusionsForDateCached(targetDateStr, totalYears) {
    if (_dateCache.has(targetDateStr)) {
        return _dateCache.get(targetDateStr);
    }
    const result = getExclusionsForDate(targetDateStr, totalYears);
    _dateCache.set(targetDateStr, result);
    return result;
}

function clearCache() {
    _allStats = null;
    _dateCache.clear();
}

module.exports = {
    loadAllStats,
    getExclusionsForDate,
    getExclusionsForDateCached,
    computeQuickStatsForDate,
    clearCache,
    parseDate,
    formatDate
};
