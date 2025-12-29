const statisticsGenerator = require('./services/statisticsGenerator');
const sumDifferenceStatsGenerator = require('./services/sumDifferenceStatsGenerator');
const headTailStatsGenerator = require('./services/headTailStatsGenerator');

async function regenerate() {
    console.log('=== Regenerating all statistics ===\n');

    console.log('1. Generating number statistics...');
    await statisticsGenerator();

    console.log('\n2. Generating sum/difference statistics...');
    await sumDifferenceStatsGenerator();

    console.log('\n3. Generating head/tail statistics...');
    await headTailStatsGenerator();

    console.log('\n=== All statistics regenerated successfully! ===');
}

regenerate().catch(console.error);
