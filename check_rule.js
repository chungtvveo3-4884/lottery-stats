const statisticsService = require('./services/statisticsService');

async function checkRule() {
    try {
        const quickStats = await statisticsService.getQuickStats();
        const key = 'tong_tt_3_5:tienLienTiep';

        if (!quickStats[key]) {
            console.log(`Rule "${key}" does NOT exist in quickStats`);
            return;
        }

        const stat = quickStats[key];
        console.log(`\n=== Checking Rule: ${key} ===`);
        console.log(`Has current: ${!!stat.current}`);

        if (!stat.current) {
            console.log('NO CURRENT STREAK - Rule will NOT be triggered');
            return;
        }

        const currentLen = stat.current.length;
        const subcategory = key.split(':')[1];
        const isSoLePattern = subcategory === 'veSole' || subcategory === 'veSoleMoi';
        const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;
        const gapInfo = stat.gapStats ? stat.gapStats[targetLen] : null;
        const recordLen = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;

        console.log(`Current Length: ${currentLen}`);
        console.log(`Target Length: ${targetLen}`);
        console.log(`Record Length: ${recordLen}`);
        console.log(`Gap Info:`, gapInfo);

        // Check exclusion conditions
        let shouldExclude = false;
        let reason = '';

        if (currentLen >= recordLen && recordLen > 0) {
            shouldExclude = true;
            reason = 'Reached record';
        } else if (currentLen >= recordLen * 0.8 && recordLen > 2) {
            shouldExclude = true;
            reason = 'Near record (>= 80%)';
        } else if (gapInfo) {
            if (gapInfo.minGap !== null && gapInfo.lastGap < gapInfo.minGap) {
                shouldExclude = true;
                reason = `LastGap(${gapInfo.lastGap}) < MinGap(${gapInfo.minGap})`;
            } else if (gapInfo.avgGap > 0 && gapInfo.lastGap < 0.15 * gapInfo.avgGap) {
                shouldExclude = true;
                reason = `LastGap(${gapInfo.lastGap}) < 15% AvgGap(${gapInfo.avgGap})`;
            }
        }

        console.log(`\nShould Exclude: ${shouldExclude}`);
        if (shouldExclude) {
            console.log(`Reason: ${reason}`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkRule();
