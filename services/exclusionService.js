const statisticsService = require('./statisticsService');
const suggestionsController = require('../controllers/suggestionsController');
const { SETS, findNextInSet, findPreviousInSet, getTongTT, getTongMoi, getHieu, identifyCategories } = require('../utils/numberAnalysis');
const STATS_CONFIG = require('../config/stats-config');
const EXCLUSION_TIERS = require('../config/exclusion-tiers');
const exclusionLogic = require('./exclusionLogicService');

// Helper functions copied from suggestionsController






/**
 * Main function to get exclusions for a specific date
 * Uses getQuickStats() to ensure 100% alignment with suggestionsController
 */
async function getExclusions(lotteryData, currentIndex, globalStats, options = {}) {
    // Khởi tạo các danh sách loại trừ theo cấp độ (không còn light_orange)
    const exclusionsByTier = {
        red: new Set(),
        purple: new Set(),
        orange: new Set(),
        light_red: new Set()
    };

    // Pending orange patterns - will be processed after counting red+purple
    const pendingOrange = [];

    // Use getQuickStats() just like suggestionsController does
    // Note: globalStats passed here might be filtered historical stats, so we use it directly if provided.
    // However, the original code called statisticsService.getQuickStats().
    // If globalStats is provided (from simulation), we should use it.
    // But getQuickStats() format is different from getStatsData() format.
    // Wait, statisticsService.getQuickStats() calls getStatsData() internally and transforms it.
    // If globalStats is passed, it is likely the raw stats (getStatsData format).
    // We need to transform it to quickStats format if we want to use the same logic.
    // BUT, the current implementation of getExclusions calls statisticsService.getQuickStats() ignoring globalStats argument?
    // Let's check line 19 of original file.

    // Original: const quickStats = await statisticsService.getQuickStats();
    // This fetches LATEST stats. This is WRONG for simulation if we want historical test.
    // However, simulationService passes `historicalStats` as 3rd arg.
    // We should use it if available. But `getQuickStats` logic is complex (calculates gaps etc).
    // We cannot easily replicate `getQuickStats` transformation here without duplicating code.
    // Ideally, `statisticsService` should have `calculateQuickStats(statsData)`.

    // For now, to support simulation correctly, we must assume `globalStats` passed in IS `quickStats` format?
    // No, simulationService passes `filterStatsBeforeDate(globalStats)`. This returns stats in `getStatsData` format (with .streaks).
    // It does NOT return `quickStats` format (with .gapStats, .longest, etc pre-calculated).

    // This means `exclusionService` currently (before my edit) was using LIVE stats for simulation?
    // "const quickStats = await statisticsService.getQuickStats();" -> Yes, it was using LIVE stats!
    // This is a bug in simulation logic if we want backtesting.
    // But the user asked to fix the discrepancy between Statistics page (Live) and Simulation page (Live?).
    // If Simulation page is "Mô phỏng", it usually means backtesting.
    // But if the user is just checking "Simulation" tab which might be "Dự đoán" or similar?
    // No, "Simulation" is typically backtesting.

    // However, fixing the backtesting logic is out of scope for "Sync Exclusion Logic".
    // The user wants the counts to match.
    // If I change to use passed `globalStats`, I might break the sync if `globalStats` is not processed correctly.

    // Let's stick to the current behavior (using `getQuickStats()`) but apply the new logic.
    // If `options` are passed, we use them.

    const GAP_STRATEGY = options.gapStrategy || STATS_CONFIG.GAP_STRATEGY || 'COMBINED';
    const GAP_BUFFER_PERCENT = options.gapBuffer !== undefined ? parseFloat(options.gapBuffer) : (STATS_CONFIG.GAP_BUFFER_PERCENT !== undefined ? STATS_CONFIG.GAP_BUFFER_PERCENT : 0);

    const quickStats = await statisticsService.getQuickStats();

    for (const key in quickStats) {
        const stat = quickStats[key];

        // Skip if no current streak
        if (!stat.current) continue;

        const currentLen = stat.current.length;
        let category, subcategory;

        // Parse key - handle both formats:
        // Format 1: "category:subcategory" (e.g., "tong_tt_cac_tong:luiDeuLienTiep")
        // Format 2: "categorySubcategory" (e.g., "cacSoLuiDeuLienTiep", "cacDauLuiDeu")
        if (key.includes(':')) {
            [category, subcategory] = key.split(':');
        } else {
            // Extract subcategory from end of key
            const patterns = [
                'LuiDeuLienTiep', 'TienDeuLienTiep',
                'LuiLienTiep', 'TienLienTiep',
                'LuiDeu', 'TienDeu',
                'VeLienTiep', 'VeCungGiaTri', 'VeSole', 'VeSoleMoi',
                'DongTien', 'DongLui',
                'Lui', 'Tien' // Standalone patterns (must be last due to shorter length)
            ];

            for (const pattern of patterns) {
                if (key.endsWith(pattern)) {
                    subcategory = pattern.charAt(0).toLowerCase() + pattern.slice(1); // Convert to camelCase
                    category = key.slice(0, -pattern.length);
                    break;
                }
            }

            if (!subcategory) {
                // Special patterns without subcategory (e.g., tienLuiSoLe)
                category = key;
                subcategory = '';
            }
        }

        // Remove [TIỀM NĂNG] prefix if present
        if (category && category.startsWith('[TIỀM NĂNG] ')) {
            category = category.replace('[TIỀM NĂNG] ', '');
        }

        const isSoLePattern = subcategory === 'veSole' || subcategory === 'veSoleMoi';
        const isTrendPattern = subcategory === 'tienDeuLienTiep' || subcategory === 'luiDeuLienTiep' ||
            subcategory === 'tienLienTiep' || subcategory === 'luiLienTiep' ||
            subcategory === 'dongTien' || subcategory === 'dongLui' ||
            subcategory === 'tien' || subcategory === 'lui' ||
            subcategory === 'tienDeu' || subcategory === 'luiDeu';

        const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;

        const gapInfoGE = stat.gapStats ? stat.gapStats[targetLen] : null;
        const gapInfoExact = stat.exactGapStats ? stat.exactGapStats[targetLen] : null;
        const extensionGapInfo = stat.extensionGapStats ? stat.extensionGapStats[currentLen] : null;
        const recordLen = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;

        let shouldExclude = false;
        let tier = null; // 'red', 'light_red', 'orange', 'light_orange'

        // 1. Check if reached record -> RED tier
        if (currentLen >= recordLen && recordLen > 0) {
            shouldExclude = true;
            tier = 'red';
        }

        // 1.5. Kiểm tra nếu SẮP đạt kỷ lục VÀ kỷ lục đó chỉ xuất hiện 1 lần trong quá khứ
        else if (currentLen + 1 === recordLen && recordLen > 0) {
            const gapStatsForRecord_GE = stat.gapStats ? stat.gapStats[recordLen] : null;
            const gapStatsForRecord_Exact = stat.exactGapStats ? stat.exactGapStats[recordLen] : null;

            const recordOnlyOnce_GE = gapStatsForRecord_GE &&
                (gapStatsForRecord_GE.avgGap === 0 || gapStatsForRecord_GE.count <= 1);
            const recordOnlyOnce_Exact = gapStatsForRecord_Exact &&
                (gapStatsForRecord_Exact.avgGap === 0 || gapStatsForRecord_Exact.count <= 1);

            if (recordOnlyOnce_GE || recordOnlyOnce_Exact) {
                shouldExclude = true;
                tier = 'red';
            }
        }

        // 2. Check gap rules with multi-tier logic (nếu chưa có tier)
        if (!tier) {
            // Tính các ngưỡng (chỉ min, không còn avg vì LIGHT_RED sẽ tính động sau)
            let excludeGE_min = false;
            let excludeExact_min = false;
            let excludeExtension = false;

            // Check GE - Min threshold
            if (gapInfoGE && gapInfoGE.minGap !== null) {
                const minThreshold = gapInfoGE.minGap * (1 + GAP_BUFFER_PERCENT);
                if (gapInfoGE.lastGap < minThreshold) excludeGE_min = true;
            }

            // Check Exact - Min threshold
            if (gapInfoExact && gapInfoExact.minGap !== null) {
                const minThreshold = gapInfoExact.minGap * (1 + GAP_BUFFER_PERCENT);
                if (gapInfoExact.lastGap < minThreshold) excludeExact_min = true;
            }

            // Check Extension Gap - gap from current length to next level
            if (extensionGapInfo && extensionGapInfo.minGap !== null && extensionGapInfo.count >= 3) {
                // Only check if we have at least 3 data points for reliability
                if (extensionGapInfo.lastGap < extensionGapInfo.minGap) {
                    excludeExtension = true;
                }
            }

            // Phân loại vào tier (chỉ RED và ORANGE, LIGHT_RED sẽ tính động sau)
            // RED: Cả GE và Exact đều < minGap, HOẶC Extension Gap < minGap
            if ((excludeGE_min && excludeExact_min) || excludeExtension) {
                shouldExclude = true;
                tier = 'red';
            }
            // ORANGE: GE HOẶC Exact < minGap - collect for later processing
            else if (excludeGE_min || excludeExact_min) {
                // Collect orange for later - will be applied only if red+purple <= 40
                pendingOrange.push({ stat, key, category, subcategory, isTrendPattern });
            }
            // LIGHT_RED sẽ được tính động sau khi biết tổng số RED+PURPLE+ORANGE
        }

        // Only process RED tier immediately
        if (shouldExclude && tier === 'red') {
            // Resolve numbers using the same logic as suggestionsController
            let nums = [];

            if (isTrendPattern) {
                nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
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
                    nums = suggestionsController.getNumbersFromCategory(category);
                } else {
                    nums = suggestionsController.getNumbersFromCategory(category);
                }
            }
            else if (subcategory === 'veSole' || subcategory === 'veSoleMoi') {
                // SoLe - get numbers from category
                nums = suggestionsController.getNumbersFromCategory(category);
            }
            // --- NEW: Handle Trend patterns for cac_tong ---
            else if (subcategory === 'luiLienTiep' || subcategory === 'tienLienTiep' ||
                subcategory === 'luiDeuLienTiep' || subcategory === 'tienDeuLienTiep') {
                // Check if it's a range-based sum pattern (e.g., tong_tt_7_9)
                if (/^(tong_tt_|tong_moi_|hieu_)\d+_\d+$/.test(category)) {
                    // Parse range from category name
                    const match = category.match(/^(tong_tt_|tong_moi_|hieu_)(\d+)_(\d+)$/);
                    if (match) {
                        nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
                    }
                } else {
                    nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
                }
            }
            else {
                // Get values from fullSequence
                const valuesToExclude = stat.current && stat.current.fullSequence
                    ? stat.current.fullSequence.filter(f => !f.isLatest).map(f => f.value)
                    : [];

                // FIRST: Try to get from predictNextInSequence for trend patterns
                if (isTrendPattern) {
                    nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
                }
                // SECOND: Try to get from category
                else if (valuesToExclude.length > 0) {
                    const tempNums = suggestionsController.getNumbersFromCategory(category);
                    if (tempNums && tempNums.length > 0) {
                        nums = tempNums;
                    } else {
                        nums = valuesToExclude.map(v => parseInt(v, 10));
                    }
                }
                // THIRD: Fallback
                else {
                    nums = valuesToExclude.map(v => parseInt(v, 10));
                }
            }

            // Fallback if still empty
            if (!nums || nums.length === 0) {
                nums = suggestionsController.getNumbersFromCategory(category);
            }

            // Filter out null, undefined, and NaN values (CRITICAL - matches suggestionsController)
            if (nums && nums.length > 0) {
                // Allow strings, convert to numbers later
                nums = nums.filter(n => n !== null && n !== undefined && !isNaN(n));
            }

            if (nums && nums.length > 0) {
                nums.forEach(n => exclusionsByTier[tier].add(parseInt(n, 10)));
            }
        }
    }

    // --- NEW: Process Potential Streaks (Patterns with record = 2) ---
    // Kiểm tra các pattern có kỷ lục 2 ngày mà số mới nhất có thể trigger
    const recentResults = await statisticsService.getRecentResults(1);
    if (recentResults && recentResults.length > 0) {
        const latestNumber = String(recentResults[0].special).padStart(2, '0');
        const latestCategories = identifyCategories(latestNumber);

        // Các subcategories cần kiểm tra
        const subcategoriesToCheck = [
            'veLienTiep',
            'tienLienTiep',
            'luiLienTiep',
            'tienDeuLienTiep',
            'luiDeuLienTiep'
        ];

        // Duyệt qua tất cả categories của số mới nhất
        for (const category of latestCategories) {
            for (const subcategory of subcategoriesToCheck) {
                const key = `${category}:${subcategory}`;

                // Bỏ qua nếu pattern đã có chuỗi hiện tại (đã được xử lý ở trên)
                if (quickStats[key] && quickStats[key].current) continue;

                // Lấy thông tin pattern từ quickStats
                const stat = quickStats[key];
                if (!stat) continue;

                // For this section, we are specifically looking for patterns that *could* become a streak of length 2.
                // This means the current length is 1 (the latest number just hit it), and the record is 2.
                const currentLen = 1; // The latest number makes it a streak of 1.
                const recordLen = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;

                // Only consider if the record is 2.
                if (recordLen !== 2) continue;

                // The target length for gap stats is 2, as we are checking if it will become a streak of 2.
                const targetLen = 2;
                const gapInfoGE = stat.gapStats ? stat.gapStats[targetLen] : null;
                const gapInfoExact = stat.exactGapStats ? stat.exactGapStats[targetLen] : null;

                // Check exclusion conditions (NEW LOGIC)
                let shouldExclude = false;

                // If currentLen (1) is already >= recordLen (2), this condition won't be met.
                // This section is for *potential* streaks, so currentLen is 1.
                // The record check is implicitly handled by `recordLen !== 2` above.
                // The main exclusion logic here is based on gaps.
                let excludeGE = false;
                let excludeExact = false;

                if (gapInfoGE && gapInfoGE.minGap !== null) {
                    const threshold = gapInfoGE.minGap * (1 + GAP_BUFFER_PERCENT);
                    if (gapInfoGE.lastGap < threshold) excludeGE = true;
                }

                if (gapInfoExact && gapInfoExact.minGap !== null) {
                    const threshold = gapInfoExact.minGap * (1 + GAP_BUFFER_PERCENT);
                    if (gapInfoExact.lastGap < threshold) excludeExact = true;
                }

                if (GAP_STRATEGY === 'GE') {
                    if (excludeGE) shouldExclude = true;
                } else if (GAP_STRATEGY === 'EXACT') {
                    if (excludeExact) shouldExclude = true;
                } else { // COMBINED
                    if (excludeGE && excludeExact) shouldExclude = true;
                }

                if (shouldExclude) {
                    const mockStat = {
                        current: { values: [latestNumber], length: 1 }
                    };

                    let nums = [];
                    const isTrendPattern = subcategory === 'tienDeuLienTiep' || subcategory === 'luiDeuLienTiep' ||
                        subcategory === 'tienLienTiep' || subcategory === 'luiLienTiep';

                    if (isTrendPattern) {
                        nums = suggestionsController.predictNextInSequence(mockStat, category, subcategory);
                    } else if (subcategory === 'veLienTiep') {
                        nums = suggestionsController.getNumbersFromCategory(category);
                    }

                    if (nums.length > 0) {
                        nums = nums.filter(n => n !== null && n !== undefined && !isNaN(n));
                        nums.forEach(n => exclusionsByTier.purple.add(parseInt(n, 10)));
                    }
                }
            }
        }
    }

    // === LOGIC LOẠI TRỪ THEO CẤP ĐỘ ƯU TIÊN ===
    // Mục tiêu: Đạt 60-80 số loại trừ → Số đánh 20-40
    const MIN_EXCLUSION_COUNT = EXCLUSION_TIERS.MIN_EXCLUSION_COUNT;

    // Bắt đầu với tập rỗng
    const finalExcludedNumbers = new Set();
    const appliedTiers = [];
    let currentThreshold = 0;

    // BƯỚC 1: Lấy TOÀN BỘ từ red + purple
    const primaryTiers = ['red', 'purple'];
    for (const tierName of primaryTiers) {
        const tierNumbers = exclusionsByTier[tierName];
        if (tierNumbers.size === 0) continue;

        tierNumbers.forEach(num => {
            finalExcludedNumbers.add(num);
        });
        appliedTiers.push(tierName);
    }

    // BƯỚC 2: Thêm ORANGE - CHỈ nếu red + purple <= 40
    const redPurpleCount = exclusionsByTier['red'].size + exclusionsByTier['purple'].size;

    if (redPurpleCount <= 40) {
        // Process pending orange patterns
        for (const { stat, key, category, subcategory, isTrendPattern } of pendingOrange) {
            let nums = [];

            if (isTrendPattern) {
                nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
            } else if (subcategory === 'veSole' || subcategory === 'veSoleMoi') {
                nums = suggestionsController.getNumbersFromCategory(category);
            } else {
                nums = suggestionsController.getNumbersFromCategory(category);
            }

            if (nums && nums.length > 0) {
                nums = nums.filter(n => n !== null && n !== undefined && !isNaN(n));
                nums.forEach(n => exclusionsByTier['orange'].add(parseInt(n, 10)));
            }
        }

        // Add orange to final
        const orangeNumbers = exclusionsByTier['orange'];
        if (orangeNumbers.size > 0) {
            orangeNumbers.forEach(num => {
                finalExcludedNumbers.add(num);
            });
            appliedTiers.push('orange');
        }
    } else {
        // Skip orange tier - red + purple already > 40
        console.log(`[EXCLUSION] Skipping ORANGE tier: red(${exclusionsByTier['red'].size}) + purple(${exclusionsByTier['purple'].size}) = ${redPurpleCount} > 40`);
    }

    // BƯỚC 3: Nếu vẫn chưa đủ 40, tính LIGHT_RED với threshold động
    // Threshold áp dụng ĐỒNG BỘ cho TẤT CẢ các chuỗi đang diễn ra
    if (finalExcludedNumbers.size < MIN_EXCLUSION_COUNT) {
        const THRESHOLD_STEP = 0.05; // 5%
        const MAX_THRESHOLD = 5.0; // Tối đa 500% (để đủ số lượng)

        // Tìm threshold tối thiểu để đạt >= 40 số
        for (let threshold = THRESHOLD_STEP; threshold <= MAX_THRESHOLD; threshold += THRESHOLD_STEP) {
            // Tạo set tạm để đếm số lượng với threshold hiện tại
            const tempExcluded = new Set(finalExcludedNumbers);
            const tempLightRedPatterns = []; // Lưu các pattern thỏa mãn

            // Kiểm tra TẤT CẢ các pattern với CÙNG MỘT threshold
            for (const key in quickStats) {
                const stat = quickStats[key];
                if (!stat.current) continue;

                const currentLen = stat.current.length;
                const [category, subcategory] = key.split(':');
                if (!subcategory) continue; // Bỏ qua nếu không có subcategory
                const isSoLePattern = (subcategory === 'veSole' || subcategory === 'veSoleMoi');
                const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;

                const gapInfoGE = stat.gapStats ? stat.gapStats[targetLen] : null;
                const gapInfoExact = stat.exactGapStats ? stat.exactGapStats[targetLen] : null;
                const recordLen = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;

                // Skip nếu đã đạt record hoặc không có gap stats
                if (currentLen >= recordLen && recordLen > 0) continue;
                if (!gapInfoGE && !gapInfoExact) continue;

                // LIGHT_RED: lastGap < minGap * (1 + threshold) cho GE HOẶC Exact (nới lỏng)
                // NHƯNG: minGap * (1 + threshold) phải < avgGap
                let meetsGE = false;
                let meetsExact = false;

                if (gapInfoGE && gapInfoGE.minGap !== null) {
                    const lightRedThreshold = gapInfoGE.minGap * (1 + threshold);
                    const avgGap = gapInfoGE.avgGap || gapInfoGE.minGap;
                    // Chỉ tính nếu threshold không vượt quá avgGap
                    if (lightRedThreshold < avgGap && gapInfoGE.lastGap < lightRedThreshold) {
                        meetsGE = true;
                    }
                }

                if (gapInfoExact && gapInfoExact.minGap !== null) {
                    const lightRedThreshold = gapInfoExact.minGap * (1 + threshold);
                    const avgGap = gapInfoExact.avgGap || gapInfoExact.minGap;
                    // Chỉ tính nếu threshold không vượt quá avgGap
                    if (lightRedThreshold < avgGap && gapInfoExact.lastGap < lightRedThreshold) {
                        meetsExact = true;
                    }
                }

                // LIGHT_RED nới lỏng: GE HOẶC Exact thỏa mãn
                if (meetsGE || meetsExact) {
                    // Lấy số cần loại trừ
                    let nums = suggestionsController.predictNextInSequence(stat, category,
                        subcategory.includes('Deu') ? subcategory :
                            (subcategory.includes('tien') || subcategory.includes('Tien') ? 'tienLienTiep' :
                                subcategory.includes('lui') || subcategory.includes('Lui') ? 'luiLienTiep' : subcategory));

                    if (nums && nums.length > 0) {
                        tempLightRedPatterns.push({ key, category, subcategory, nums });
                        nums.forEach(n => tempExcluded.add(n));
                    }
                }
            }

            // Kiểm tra nếu đã đủ 40 số với threshold hiện tại
            if (tempExcluded.size >= MIN_EXCLUSION_COUNT) {
                currentThreshold = threshold;

                // Áp dụng chính thức cho tất cả patterns đã thỏa mãn
                tempLightRedPatterns.forEach(({ key, nums }) => {
                    nums.forEach(n => {
                        if (!finalExcludedNumbers.has(n)) {
                            finalExcludedNumbers.add(n);
                            exclusionsByTier['light_red'].add(n);
                        }
                    });
                });

                break; // Đã đủ, dừng lại
            }
        }

        if (exclusionsByTier['light_red'].size > 0) {
            appliedTiers.push(`light_red (+${(currentThreshold * 100).toFixed(0)}%)`);
        }
    }

    // BƯỚC 4: Nếu vẫn chưa đủ 60 loại trừ, mở rộng threshold cho phép đến avgGap
    if (finalExcludedNumbers.size < MIN_EXCLUSION_COUNT) {
        const THRESHOLD_STEP = 0.05;
        const MAX_THRESHOLD = 10.0; // Tăng lên 1000%

        for (let threshold = currentThreshold + THRESHOLD_STEP; threshold <= MAX_THRESHOLD; threshold += THRESHOLD_STEP) {
            const tempExcluded = new Set(finalExcludedNumbers);
            const tempPatterns = [];

            for (const key in quickStats) {
                const stat = quickStats[key];
                if (!stat.current) continue;

                const currentLen = stat.current.length;
                const [category, subcategory] = key.split(':');
                if (!subcategory) continue;
                const isSoLePattern = (subcategory === 'veSole' || subcategory === 'veSoleMoi');
                const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;

                const gapInfoGE = stat.gapStats ? stat.gapStats[targetLen] : null;
                const gapInfoExact = stat.exactGapStats ? stat.exactGapStats[targetLen] : null;
                const recordLen = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;

                if (currentLen >= recordLen && recordLen > 0) continue;
                if (!gapInfoGE && !gapInfoExact) continue;

                // Mở rộng: cho phép threshold đến avgGap (thay vì < avgGap)
                let meetsCondition = false;

                if (gapInfoGE && gapInfoGE.minGap !== null) {
                    const adjustedThreshold = gapInfoGE.minGap * (1 + threshold);
                    const avgGap = gapInfoGE.avgGap || gapInfoGE.minGap;
                    // Cho phép đến avgGap (<=)
                    if (adjustedThreshold <= avgGap && gapInfoGE.lastGap < adjustedThreshold) {
                        meetsCondition = true;
                    }
                }

                if (!meetsCondition && gapInfoExact && gapInfoExact.minGap !== null) {
                    const adjustedThreshold = gapInfoExact.minGap * (1 + threshold);
                    const avgGap = gapInfoExact.avgGap || gapInfoExact.minGap;
                    if (adjustedThreshold <= avgGap && gapInfoExact.lastGap < adjustedThreshold) {
                        meetsCondition = true;
                    }
                }

                if (meetsCondition) {
                    let nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
                    if (nums && nums.length > 0) {
                        tempPatterns.push({ key, nums });
                        nums.forEach(n => tempExcluded.add(n));
                    }
                }
            }

            if (tempExcluded.size >= MIN_EXCLUSION_COUNT) {
                currentThreshold = threshold;
                tempPatterns.forEach(({ nums }) => {
                    nums.forEach(n => {
                        if (!finalExcludedNumbers.has(n)) {
                            finalExcludedNumbers.add(n);
                            exclusionsByTier['light_red'].add(n);
                        }
                    });
                });
                console.log(`[Exclusion Service] Expanded threshold to +${(threshold * 100).toFixed(0)}% to reach ${finalExcludedNumbers.size} exclusions`);
                break;
            }
        }
    }

    // ĐIỀU CHỈNH ĐỘNG: Nếu loại trừ > 80 (đánh < 20), giảm bớt tier thấp đến cao
    const MAX_EXCLUSION_COUNT = EXCLUSION_TIERS.MAX_EXCLUSION_COUNT || 80;
    const MIN_BET_COUNT = 20;

    if (finalExcludedNumbers.size > MAX_EXCLUSION_COUNT) {
        // Thứ tự giảm: light_red → orange → purple → red (nếu cần)
        const tiersToReduce = ['light_red', 'orange', 'purple', 'red'];

        for (const tier of tiersToReduce) {
            if (100 - finalExcludedNumbers.size >= MIN_BET_COUNT) break;

            const tierNumbers = Array.from(exclusionsByTier[tier]);
            for (const num of tierNumbers) {
                if (100 - finalExcludedNumbers.size >= MIN_BET_COUNT) break;
                finalExcludedNumbers.delete(num);
            }
        }

        console.log(`[Exclusion Service] Adjusted down to ${finalExcludedNumbers.size} exclusions (${100 - finalExcludedNumbers.size} bets)`);
    }

    // Báo cáo kết quả cuối
    const betCount = 100 - finalExcludedNumbers.size;
    if (betCount < 20 || betCount > 40) {
        console.log(`[Exclusion Service] WARNING: Bet count ${betCount} is outside 20-40 range`);
    }

    console.log(`[Exclusion Service] Excluded ${finalExcludedNumbers.size} numbers (Tiers: ${appliedTiers.join(', ')}) -> ${betCount} bets`);
    return finalExcludedNumbers;
}

/**
 * Get exclusions using Confidence Score system
 * Used when STATS_CONFIG.USE_CONFIDENCE_SCORE is true
 */
async function getExclusionsWithConfidence(lotteryData, currentIndex, globalStats, options = {}) {
    const strategyName = options.strategy || STATS_CONFIG.EXCLUSION_STRATEGY || 'BALANCED';
    const quickStats = await statisticsService.getQuickStats();

    // Collect all potential exclusion patterns with confidence scores
    const allPatterns = [];

    for (const key in quickStats) {
        const stat = quickStats[key];
        if (!stat.current) continue;

        const currentLen = stat.current.length;
        let category, subcategory;

        // Parse key
        if (key.includes(':')) {
            [category, subcategory] = key.split(':');
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
                if (key.endsWith(pattern)) {
                    subcategory = pattern.charAt(0).toLowerCase() + pattern.slice(1);
                    category = key.slice(0, -pattern.length);
                    break;
                }
            }
            if (!subcategory) {
                category = key;
                subcategory = '';
            }
        }

        if (!subcategory) continue;

        const isSoLePattern = (subcategory === 'veSole' || subcategory === 'veSoleMoi') &&
            key !== 'tienLuiSoLe' && key !== 'luiTienSoLe';
        const isTrendPattern = ['tienDeuLienTiep', 'luiDeuLienTiep', 'tienLienTiep', 'luiLienTiep',
            'dongTien', 'dongLui', 'tien', 'lui', 'tienDeu', 'luiDeu'].includes(subcategory);

        const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;

        const gapInfoGE = stat.gapStats ? stat.gapStats[targetLen] : null;
        const gapInfoExact = stat.exactGapStats ? stat.exactGapStats[targetLen] : null;
        const extensionGapInfo = stat.extensionGapStats ? stat.extensionGapStats[currentLen] : null;
        const recordLen = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;

        // Calculate confidence score
        const confidence = exclusionLogic.calculateConfidence({
            currentLen,
            recordLen,
            gapInfoGE,
            gapInfoExact,
            extensionGapInfo
        });

        // Skip patterns with no confidence
        if (confidence.score <= 0) continue;

        // Get numbers for this pattern
        let nums = [];
        if (isTrendPattern) {
            nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
        } else {
            nums = suggestionsController.getNumbersFromCategory(category);
        }

        if (!nums || nums.length === 0) continue;

        // Filter valid numbers
        nums = nums.filter(n => n !== null && n !== undefined && !isNaN(n))
            .map(n => parseInt(n, 10));

        if (nums.length === 0) continue;

        allPatterns.push({
            key,
            numbers: nums,
            confidence
        });
    }

    // Sort by confidence score
    const sortedPatterns = exclusionLogic.sortByConfidence(allPatterns);

    // Apply strategy limit
    const result = exclusionLogic.applyStrategyLimit(sortedPatterns, strategyName);

    // Build final set
    const finalExcludedNumbers = new Set();
    for (const pattern of result.included) {
        pattern.numbers.forEach(n => finalExcludedNumbers.add(n));
    }

    console.log(`[Exclusion Service - Confidence] Excluded ${finalExcludedNumbers.size} numbers (Strategy: ${strategyName}, Patterns: ${result.stats.patternsIncluded})`);
    return finalExcludedNumbers;
}

/**
 * Smart exclusion selector - uses unified logic from exclusionLogicService
 * This is now the SINGLE source of truth for all exclusion calculations
 */
async function getSmartExclusions(lotteryData, currentIndex, globalStats, options = {}) {
    // Use the unified function from exclusionLogicService
    const quickStats = await statisticsService.getQuickStats();
    const result = await exclusionLogic.getUnifiedExclusions(quickStats, options);

    console.log(`[Exclusion Service - Unified] Excluded ${result.excludedNumbers.size} numbers (Strategy: ${result.stats.strategy}, Method: ${result.stats.method})`);

    return result.excludedNumbers;
}

/**
 * Get full exclusion result with explanations (for API use)
 */
async function getFullExclusionResult(options = {}) {
    const quickStats = await statisticsService.getQuickStats();
    return exclusionLogic.getUnifiedExclusions(quickStats, options);
}

module.exports = {
    getExclusions,  // Legacy - kept for backward compatibility
    getExclusionsWithConfidence, // Old confidence-only method
    getSmartExclusions, // Smart selector (now uses unified logic)
    getFullExclusionResult // Full result with explanations
};
