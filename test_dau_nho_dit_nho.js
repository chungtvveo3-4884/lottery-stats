const statisticsService = require('./services/statisticsService');
const suggestionsController = require('./controllers/suggestionsController');

async function testDauNhoDitNho() {
    try {
        console.log('=== Testing dau_nho_dit_nho:tienDeuLienTiep ===\n');

        const quickStats = await statisticsService.getQuickStats();
        const key = 'dau_nho_dit_nho:tienDeuLienTiep';

        if (!quickStats[key]) {
            console.log(`Key "${key}" not found in quickStats`);
            return;
        }

        const stat = quickStats[key];
        console.log('Current streak:', stat.current);
        console.log('Record length:', stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0);

        if (!stat.current) {
            console.log('No current streak');
            return;
        }

        const [category, subcategory] = key.split(':');
        console.log(`\nCategory: ${category}`);
        console.log(`Subcategory: ${subcategory}`);

        // Test predictNextInSequence
        const nums = suggestionsController.predictNextInSequence(stat, category, subcategory);
        console.log(`\nPredicted numbers (${nums.length}):`, nums);

        // Test getNumbersFromCategory
        const allNums = suggestionsController.getNumbersFromCategory(category);
        console.log(`\nAll numbers in category (${allNums.length}):`, allNums.slice(0, 10), '...');

    } catch (error) {
        console.error('Error:', error);
    }
}

testDauNhoDitNho();
