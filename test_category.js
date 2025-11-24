const suggestionsController = require('./controllers/suggestionsController');

const nums = suggestionsController.getNumbersFromCategory('tong_tt_3_5');
console.log(`getNumbersFromCategory('tong_tt_3_5') returns (${nums.length}): ${nums.join(', ')}`);

const problematic = [58, 59, 67, 68, 76, 77, 85, 86, 95];
const hasProblematic = nums.filter(n => problematic.includes(n));
console.log(`Includes problematic: ${hasProblematic.join(', ') || 'NONE'}`);
