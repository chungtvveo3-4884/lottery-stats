const s = require('./services/statisticsService.js');
s.getQuickStats().then(stats => {
    Object.keys(stats).forEach(k => {
        let stat = stats[k];
        if(!stat.current) return;
        const currentLen = stat.current.length;
        const isSoLePattern = (k.toLowerCase().includes('sole') || k.toLowerCase().includes('solemoi')) && !k.toLowerCase().includes('tienluisole');
        const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;
        const targetCount = stat.exactGapStats && stat.exactGapStats[targetLen] ? stat.exactGapStats[targetLen].count : 0;
        const freq = targetCount / 20.145; // Approx
        if (freq > 0 && freq <= 0.5) {
            console.log(k, 'Len:', currentLen, 'Target:', targetLen, 'Freq:', freq.toFixed(2), 'Count:', targetCount);
        }
    });
});
