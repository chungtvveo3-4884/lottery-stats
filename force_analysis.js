const dailyAnalysisService = require('./services/dailyAnalysisService');
const statisticsService = require('./services/statisticsService');
const lotteryService = require('./services/lotteryService');

async function run() {
    console.log('Initializing services...');
    await lotteryService.loadData();
    await statisticsService.calculateStats();

    console.log('Running analysis...');
    await dailyAnalysisService.analyzeAndSavePrediction();
    console.log('Done!');
}

run().catch(console.error);
