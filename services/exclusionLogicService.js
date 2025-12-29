/**
 * Unified Exclusion Logic Service
 * Single source of truth for all exclusion calculations
 * Used by: suggestionsController, exclusionService, simulationService
 */

const STATS_CONFIG = require('../config/stats-config');

// ============= WEIGHTED VOTING =============
/**
 * Calculate votes for each number based on patterns
 * @param {Array} patterns - Array of { numbers: [], confidence: {score, tier}, ... }
 * @returns {Map<number, {votes: number, sources: string[]}>}
 */
function calculateVotes(patterns) {
    const votes = new Map();

    for (const pattern of patterns) {
        if (!pattern.numbers || pattern.numbers.length === 0) continue;

        // Weight based on confidence score (0-1)
        const weight = pattern.confidence?.score || 0.5;

        for (const num of pattern.numbers) {
            const n = parseInt(num, 10);
            if (isNaN(n)) continue;

            if (!votes.has(n)) {
                votes.set(n, { votes: 0, sources: [], weight: 0 });
            }

            const entry = votes.get(n);
            entry.votes += 1;
            entry.weight += weight;
            entry.sources.push(pattern.key || pattern.title || 'unknown');
        }
    }

    return votes;
}

/**
 * Get excluded numbers using Weighted Voting
 * @param {Array} patterns - All patterns with numbers and confidence
 * @param {Object} options - { minVotes: 2, maxNumbers: 50 }
 * @returns {Object} { excludedNumbers: Set, votesMap: Map, stats: {} }
 */
function getExclusionsByVoting(patterns, options = {}) {
    const {
        minVotes = STATS_CONFIG.VOTING_MIN_VOTES || 2,
        minWeight = STATS_CONFIG.VOTING_MIN_WEIGHT || 0.5,
        maxNumbers = STATS_CONFIG.VOTING_MAX_NUMBERS || 50
    } = options;

    const votes = calculateVotes(patterns);

    // Sort by weight (primary) then by votes (secondary)
    const sortedNumbers = Array.from(votes.entries())
        .filter(([num, info]) => info.votes >= minVotes || info.weight >= minWeight)
        .sort((a, b) => {
            if (b[1].weight !== a[1].weight) return b[1].weight - a[1].weight;
            return b[1].votes - a[1].votes;
        });

    // Take top N numbers
    const excluded = new Set();
    const includedNumbers = sortedNumbers.slice(0, maxNumbers);

    for (const [num, info] of includedNumbers) {
        excluded.add(num);
    }

    return {
        excludedNumbers: excluded,
        votesMap: votes,
        included: includedNumbers,
        stats: {
            totalPatterns: patterns.length,
            numbersWithVotes: votes.size,
            excludedCount: excluded.size,
            method: 'VOTING'
        }
    };
}

// ============= HISTORICAL WIN RATE =============
/**
 * Calculate historical win rate for a pattern
 * Based on how often the pattern's prediction was correct
 * @param {Object} stat - Pattern statistics with streaks
 * @returns {number} Win rate (0-1)
 */
function calculateWinRate(stat) {
    if (!stat || !stat.gapStats) return 0;

    // For each target length, check if lastGap < minGap historically led to correct predictions
    // This is approximated by: patterns that broke soon after lastGap < minGap

    // Simplified: Use count and avgGap to estimate reliability
    // Higher count + lower variance = more reliable

    let totalChecks = 0;
    let successfulPredictions = 0;

    for (const len in stat.gapStats) {
        const gapInfo = stat.gapStats[len];
        if (!gapInfo || gapInfo.count < 3) continue;

        // If minGap is close to avgGap, pattern is consistent
        const consistency = gapInfo.minGap / Math.max(gapInfo.avgGap, 1);

        // Count as "successful" if pattern shows consistency
        if (consistency > 0.3 && gapInfo.count >= 5) {
            successfulPredictions += 1;
        }
        totalChecks += 1;
    }

    if (totalChecks === 0) return 0;
    return successfulPredictions / totalChecks;
}

/**
 * Filter patterns by historical win rate
 * @param {Array} patterns - Patterns with stat reference
 * @param {number} minWinRate - Minimum win rate (0-1)
 * @returns {Array} Filtered patterns
 */
function filterByWinRate(patterns, minWinRate = 0.3) {
    return patterns.filter(p => {
        const winRate = p.winRate || calculateWinRate(p.stat);
        return winRate >= minWinRate;
    });
}

// ============= CONFIDENCE SCORE (kept from before) =============
const WEIGHTS = {
    gapRatio: 0.4,
    dataReliability: 0.3,
    streakIntensity: 0.2,
    winRate: 0.1
};

function calculateConfidence(params) {
    const {
        currentLen = 0,
        recordLen = 0,
        gapInfoGE = null,
        gapInfoExact = null,
        extensionGapInfo = null,
        stat = null
    } = params;

    const reasons = [];
    let gapRatioScore = 0;

    // Gap Ratio Score
    if (gapInfoGE && gapInfoGE.minGap !== null && gapInfoGE.lastGap < gapInfoGE.minGap) {
        const geRatio = (gapInfoGE.minGap - gapInfoGE.lastGap) / Math.max(gapInfoGE.avgGap, 1);
        gapRatioScore = Math.max(gapRatioScore, Math.min(geRatio, 1));
        reasons.push(`GE: Gap(${gapInfoGE.lastGap}) < Min(${gapInfoGE.minGap})`);
    }

    if (gapInfoExact && gapInfoExact.minGap !== null && gapInfoExact.lastGap < gapInfoExact.minGap) {
        const exactRatio = (gapInfoExact.minGap - gapInfoExact.lastGap) / Math.max(gapInfoExact.avgGap, 1);
        gapRatioScore = Math.max(gapRatioScore, Math.min(exactRatio, 1));
        reasons.push(`Exact: Gap(${gapInfoExact.lastGap}) < Min(${gapInfoExact.minGap})`);
    }

    if (extensionGapInfo && extensionGapInfo.minGap !== null && extensionGapInfo.count >= 3) {
        if (extensionGapInfo.lastGap < extensionGapInfo.minGap) {
            const extRatio = (extensionGapInfo.minGap - extensionGapInfo.lastGap) / Math.max(extensionGapInfo.avgGap, 1);
            gapRatioScore = Math.max(gapRatioScore, Math.min(extRatio, 1));
            reasons.push(`Ext: Gap(${extensionGapInfo.lastGap}) < Min(${extensionGapInfo.minGap})`);
        }
    }

    // Data Reliability
    const count = Math.max(
        gapInfoGE?.count || 0,
        gapInfoExact?.count || 0,
        extensionGapInfo?.count || 0
    );
    const dataReliabilityScore = Math.min(count / 50, 1);

    // Streak Intensity
    let streakIntensityScore = 0;
    if (recordLen > 0 && currentLen > 0) {
        streakIntensityScore = currentLen / recordLen;
        if (currentLen >= recordLen) {
            streakIntensityScore = 1.0;
            reasons.push(`Đạt kỷ lục: ${currentLen} >= ${recordLen}`);
        }
    }

    // Win Rate
    const winRateScore = stat ? calculateWinRate(stat) : 0;

    // Total score
    const totalScore =
        WEIGHTS.gapRatio * gapRatioScore +
        WEIGHTS.dataReliability * dataReliabilityScore +
        WEIGHTS.streakIntensity * streakIntensityScore +
        WEIGHTS.winRate * winRateScore;

    // Boost if both GE and Exact
    const bothGEandExact = gapInfoGE && gapInfoExact &&
        gapInfoGE.minGap !== null && gapInfoExact.minGap !== null &&
        gapInfoGE.lastGap < gapInfoGE.minGap && gapInfoExact.lastGap < gapInfoExact.minGap;

    const finalScore = bothGEandExact ? Math.min(totalScore * 1.2, 1.0) : totalScore;

    // Determine tier
    let tier = 'skip';
    if (finalScore >= 0.7) tier = 'critical';
    else if (finalScore >= 0.5) tier = 'high';
    else if (finalScore >= 0.3) tier = 'moderate';
    else if (finalScore >= 0.15) tier = 'low';

    return {
        score: Math.round(finalScore * 100) / 100,
        tier,
        reasons,
        components: { gapRatio: gapRatioScore, dataReliability: dataReliabilityScore, streakIntensity: streakIntensityScore, winRate: winRateScore }
    };
}

// ============= STRATEGIES =============
const STRATEGIES = {
    CONSERVATIVE: { minVotes: 3, minWeight: 0.8, maxNumbers: 35 },
    BALANCED: { minVotes: 2, minWeight: 0.5, maxNumbers: 50 },
    AGGRESSIVE: { minVotes: 1, minWeight: 0.2, maxNumbers: 80 }
};

function getStrategy(name = null) {
    const strategyName = name || STATS_CONFIG.EXCLUSION_STRATEGY || 'BALANCED';
    return STRATEGIES[strategyName] || STRATEGIES.BALANCED;
}

// ============= UNIFIED EXCLUSION FUNCTION =============
/**
 * Main function to get exclusions - COMBINED 6 METHODS
 * Methods:
 * 1. Confidence Score - tính điểm tin cậy tổng hợp
 * 2. Weighted Voting - mỗi pattern vote cho các số
 * 3. Historical Win Rate - lọc theo tỷ lệ thắng lịch sử
 * 4. Top-K Patterns - lấy K pattern điểm cao nhất
 * 5. Gap Ratio - kiểm tra lastGap vs minGap
 * 6. Streak Intensity - gần kỷ lục → điểm cao hơn
 * 
 * @param {Object} quickStats - Statistics data
 * @param {Object} options - { strategy: 'BALANCED', targetCount: 50-60 }
 * @returns {Object} { excludedNumbers: Set, explanations: [], stats: {} }
 */
async function getUnifiedExclusions(quickStats, options = {}) {
    const {
        strategy = STATS_CONFIG.EXCLUSION_STRATEGY || 'BALANCED',
        targetMin = 50,
        targetMax = 60
    } = options;

    const suggestionsController = require('../controllers/suggestionsController');

    // Step 1: Collect all patterns with all 6 method scores
    const allPatterns = [];

    for (const key in quickStats) {
        const stat = quickStats[key];
        if (!stat.current) continue;

        const currentLen = stat.current.length;
        let category, subcategory;

        if (key.includes(':')) {
            [category, subcategory] = key.split(':');
        } else {
            const patterns = [
                'LuiDeuLienTiep', 'TienDeuLienTiep', 'LuiLienTiep', 'TienLienTiep',
                'LuiDeu', 'TienDeu', 'VeLienTiep', 'VeCungGiaTri', 'VeSole', 'VeSoleMoi',
                'DongTien', 'DongLui', 'Lui', 'Tien'
            ];
            for (const p of patterns) {
                if (key.endsWith(p)) {
                    subcategory = p.charAt(0).toLowerCase() + p.slice(1);
                    category = key.slice(0, -p.length);
                    break;
                }
            }
            if (!subcategory) { category = key; subcategory = ''; }
        }

        if (!subcategory) continue;

        const isSoLePattern = (subcategory === 'veSole' || subcategory === 'veSoleMoi') &&
            key !== 'tienLuiSoLe' && key !== 'luiTienSoLe';
        const isTienLuiSoLePattern = subcategory === 'tienLuiSoLe' || subcategory === 'luiTienSoLe';
        const isTrendPattern = ['tienDeuLienTiep', 'luiDeuLienTiep', 'tienLienTiep', 'luiLienTiep',
            'dongTien', 'dongLui', 'tien', 'lui', 'tienDeu', 'luiDeu', 'tienLuiSoLe', 'luiTienSoLe'].includes(subcategory);

        // Tiến Lùi So Le: minLength = 4, nên chỉ xét khi currentLen >= 4
        if (isTienLuiSoLePattern && currentLen < 4) continue;

        const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;

        const gapInfoGE = stat.gapStats?.[targetLen];
        const gapInfoExact = stat.exactGapStats?.[targetLen];
        const extensionGapInfo = stat.extensionGapStats?.[currentLen];
        const recordLen = stat.longest?.[0]?.length || 0;

        // ===== METHOD 1: Confidence Score =====
        const confidence = calculateConfidence({
            currentLen, recordLen, gapInfoGE, gapInfoExact, extensionGapInfo, stat
        });

        // ===== METHOD 3: Historical Win Rate =====
        const winRate = calculateWinRate(stat);

        // ===== METHOD 5: Gap Ratio (separate scoring) =====
        let gapRatioScore = 0;
        if (gapInfoGE?.minGap && gapInfoGE.lastGap < gapInfoGE.minGap) {
            gapRatioScore = Math.max(gapRatioScore, (gapInfoGE.minGap - gapInfoGE.lastGap) / gapInfoGE.avgGap);
        }
        if (gapInfoExact?.minGap && gapInfoExact.lastGap < gapInfoExact.minGap) {
            gapRatioScore = Math.max(gapRatioScore, (gapInfoExact.minGap - gapInfoExact.lastGap) / gapInfoExact.avgGap);
        }
        if (extensionGapInfo?.minGap && extensionGapInfo.lastGap < extensionGapInfo.minGap) {
            gapRatioScore = Math.max(gapRatioScore, (extensionGapInfo.minGap - extensionGapInfo.lastGap) / extensionGapInfo.avgGap);
        }
        gapRatioScore = Math.min(gapRatioScore, 1);

        // ===== METHOD 6: Streak Intensity =====
        const streakIntensity = recordLen > 0 ? Math.min(currentLen / recordLen, 1) : 0;

        // Skip if no meaningful signal at all
        if (confidence.score <= 0.05 && gapRatioScore <= 0 && streakIntensity < 0.3) continue;

        // Get numbers
        let nums = [];
        if (isTrendPattern) {
            nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
        } else {
            nums = suggestionsController.getNumbersFromCategory(category);
        }

        if (!nums || nums.length === 0) continue;
        nums = nums.filter(n => n !== null && n !== undefined && !isNaN(n)).map(n => parseInt(n, 10));
        if (nums.length === 0) continue;

        // ===== COMBINED SCORE (Kết hợp 6 phương pháp) =====
        const combinedScore =
            0.30 * confidence.score +         // Method 1: Confidence
            0.20 * winRate +                  // Method 3: Win Rate
            0.25 * gapRatioScore +            // Method 5: Gap Ratio
            0.25 * streakIntensity;           // Method 6: Streak Intensity

        allPatterns.push({
            key, stat, category, subcategory,
            currentLen, recordLen,
            numbers: nums,
            confidence,
            winRate,
            gapRatioScore,
            streakIntensity,
            combinedScore,
            title: getCategoryName(category, subcategory, key),
            explanation: buildExplanation(confidence, gapInfoGE, gapInfoExact, extensionGapInfo)
        });
    }

    // ===== METHOD 4: Top-K Patterns =====
    // Sort by combinedScore descending
    allPatterns.sort((a, b) => b.combinedScore - a.combinedScore);

    // ===== METHOD 2: Weighted Voting =====
    // Calculate votes for each number based on pattern combinedScore
    const numberScores = new Map();

    for (const pattern of allPatterns) {
        for (const num of pattern.numbers) {
            if (!numberScores.has(num)) {
                numberScores.set(num, { score: 0, votes: 0, sources: [] });
            }
            const entry = numberScores.get(num);
            entry.score += pattern.combinedScore;
            entry.votes += 1;
            entry.sources.push({ key: pattern.key, score: pattern.combinedScore });
        }
    }

    // Sort numbers by total score
    const sortedNumbers = Array.from(numberScores.entries())
        .sort((a, b) => b[1].score - a[1].score);

    // ===== FINAL SELECTION =====
    // Take numbers until we reach target count (50-60)
    const excluded = new Set();
    const targetCount = Math.round((targetMin + targetMax) / 2); // Default: 55

    for (const [num, info] of sortedNumbers) {
        if (excluded.size >= targetMax) break;
        excluded.add(num);
    }

    // If we have less than targetMin, add more from top patterns
    if (excluded.size < targetMin) {
        for (const pattern of allPatterns) {
            if (excluded.size >= targetMin) break;
            for (const num of pattern.numbers) {
                if (!excluded.has(num)) {
                    excluded.add(num);
                    if (excluded.size >= targetMin) break;
                }
            }
        }
    }

    // Build explanations
    const explanations = [];
    const usedPatterns = new Set();

    for (const pattern of allPatterns) {
        const includedNums = pattern.numbers.filter(n => excluded.has(n));
        if (includedNums.length > 0 && !usedPatterns.has(pattern.key)) {
            usedPatterns.add(pattern.key);
            explanations.push({
                type: 'exclude',
                title: pattern.title,
                explanation: pattern.explanation,
                numbers: includedNums,
                tier: mapTier(pattern.confidence.tier),
                confidence: pattern.confidence.score,
                winRate: pattern.winRate,
                combinedScore: Math.round(pattern.combinedScore * 100) / 100
            });
        }
    }

    // Sort explanations by combinedScore
    explanations.sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0));

    return {
        excludedNumbers: excluded,
        explanations,
        stats: {
            strategy,
            method: 'COMBINED_6',
            patternsTotal: allPatterns.length,
            excludedCount: excluded.size,
            targetRange: `${targetMin}-${targetMax}`
        }
    };
}

// Helper functions
function getCategoryName(category, subcategory, key) {
    const categoryNames = {
        'cacSo': 'Các số', 'cacDau': 'Các Đầu', 'cacDit': 'Các Đít',
        'tong_tt_cac_tong': 'Tổng TT - Các tổng',
        'tong_moi_cac_tong': 'Tổng Mới - Các tổng',
        'hieu_cac_hieu': 'Hiệu - Các hiệu'
    };
    const subcategoryNames = {
        'veSole': 'Về so le', 'veSoleMoi': 'Về so le mới',
        'veLienTiep': 'Về liên tiếp', 'luiLienTiep': 'Lùi liên tiếp',
        'tienLienTiep': 'Tiến liên tiếp', 'luiDeuLienTiep': 'Lùi Đều',
        'tienDeuLienTiep': 'Tiến Đều', 'tien': 'Tiến', 'lui': 'Lùi'
    };

    let catName = categoryNames[category] || category;
    if (category.match(/^(tong_tt_|tong_moi_|hieu_)\d+_\d+$/)) {
        const match = category.match(/^(tong_tt_|tong_moi_|hieu_)(\d+)_(\d+)$/);
        if (match) {
            const prefix = match[1] === 'tong_tt_' ? 'Tổng TT' : (match[1] === 'tong_moi_' ? 'Tổng Mới' : 'Hiệu');
            catName = `${prefix} - (${match[2]},${match[3]})`;
        }
    }
    return `${catName} - ${subcategoryNames[subcategory] || subcategory}`;
}

function buildExplanation(confidence, gapInfoGE, gapInfoExact, extensionGapInfo) {
    const parts = [];
    if (gapInfoGE?.lastGap < gapInfoGE?.minGap) parts.push(`GE: ${gapInfoGE.lastGap}<${gapInfoGE.minGap}`);
    if (gapInfoExact?.lastGap < gapInfoExact?.minGap) parts.push(`Exact: ${gapInfoExact.lastGap}<${gapInfoExact.minGap}`);
    if (extensionGapInfo?.lastGap < extensionGapInfo?.minGap) parts.push(`Ext: ${extensionGapInfo.lastGap}<${extensionGapInfo.minGap}`);

    const tierIcon = { critical: '🔴', high: '🟠', moderate: '🟡', low: '⚪' }[confidence.tier] || '⚫';
    return `${tierIcon} ${Math.round(confidence.score * 100)}% - ${parts.join(', ') || 'Pattern match'}`;
}

function mapTier(tier) {
    return { critical: 'red', high: 'red', moderate: 'orange', low: 'light_red' }[tier] || null;
}

module.exports = {
    calculateVotes,
    getExclusionsByVoting,
    calculateWinRate,
    filterByWinRate,
    calculateConfidence,
    getStrategy,
    getUnifiedExclusions,
    STRATEGIES,
    WEIGHTS
};
