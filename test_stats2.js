const d = require('./services/exclusionLogicService.js');
const s = require('./services/statisticsService.js');
s.getQuickStats().then(stats => {
   d.getUnifiedExclusions(stats, {}).then(ex => {
       const keys = ['dau_5:veSole', 'dau_5:veSoleMoi', 'tong_tt_8:veLienTiep', 'tong_moi_8_10:veLienTiep'];
       keys.forEach(key => {
           console.log("Checking", key);
           const pat = ex.explanations.find(p => p.title.toLowerCase().includes(key.split(':')[0].toLowerCase()));
           console.log('Found:', pat ? pat.title : 'Not in explanations');
       });
   });
});
