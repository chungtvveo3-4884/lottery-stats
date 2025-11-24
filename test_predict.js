const statisticsService = require('./services/statisticsService');
const suggestionsController = require('./controllers/suggestionsController');

async function testPredictNext() {
    try {
        const quickStats = await statisticsService.getQuickStats();
        const key = 'tong_tt_3_5:tienLienTiep';
        const stat = quickStats[key];
        const [category, subcategory] = key.split(':');

        console.log('=== Testing predictNextInSequence ===');
        console.log(`Key: ${key}`);
        console.log(`Category: ${category}`);
        console.log(`Subcategory: ${subcategory}`);
        console.log(`Current:`, stat.current);

        const nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
        console.log(`\nPredicted numbers (${nums.length}): ${nums.join(', ')}`);

        // Check if it includes problematic numbers
        const problematic = [58, 59, 67, 68, 76, 77, 85, 86, 95];
        const hasProblematic = nums.filter(n => problematic.includes(n));
        console.log(`\nIncludes problematic: ${hasProblematic.join(', ') || 'NONE'}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

testPredictNext();
