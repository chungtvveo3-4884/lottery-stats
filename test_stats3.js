const d = require('./services/exclusionLogicService.js');
const s = require('./services/statisticsService.js');
s.getQuickStats().then(stats => {
   d.getUnifiedExclusions(stats, {}).then(ex => {
       console.log('Total explanations:', ex.explanations.length);
       ex.explanations.forEach(e => console.log('- ' + e.title + ' | Tier: ' + e.tier + ' | Reason: ' + e.reason));
   });
});
