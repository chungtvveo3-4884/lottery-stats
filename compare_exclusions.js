const axios = require('axios');
const exclusionService = require('./services/exclusionService');
const statisticsService = require('./services/statisticsService');
const lotteryService = require('./services/lotteryService');

async function compareExclusions() {
    try {
        console.log('=== Comparing Exclusions ===\n');

        // 1. Get from API (what frontend sees)
        const apiResponse = await axios.get('http://localhost:6868/api/suggestions');
        const apiExcluded = apiResponse.data.excludedNumbers;
        console.log(`API Excluded Count: ${apiExcluded.length}`);
        console.log(`API Excluded Numbers: ${apiExcluded.join(', ')}\n`);

        // 2. Get from exclusionService (what simulation uses)
        await lotteryService.loadRawData();
        const rawData = lotteryService.getRawData();
        const globalStats = await statisticsService.getStatsData();
        const currentIndex = rawData.length - 1;

        const serviceExcluded = await exclusionService.getExclusions(rawData, currentIndex, globalStats);
        const serviceExcludedArray = Array.from(serviceExcluded).sort((a, b) => a - b);
        console.log(`Service Excluded Count: ${serviceExcluded.size}`);
        console.log(`Service Excluded Numbers: ${serviceExcludedArray.join(', ')}\n`);

        // 3. Find differences
        const apiSet = new Set(apiExcluded);
        const serviceSet = serviceExcluded;

        const inApiNotService = apiExcluded.filter(n => !serviceSet.has(n));
        const inServiceNotApi = serviceExcludedArray.filter(n => !apiSet.has(n));

        if (inApiNotService.length > 0) {
            console.log(`In API but NOT in Service (${inApiNotService.length}): ${inApiNotService.join(', ')}`);
        }

        if (inServiceNotApi.length > 0) {
            console.log(`In Service but NOT in API (${inServiceNotApi.length}): ${inServiceNotApi.join(', ')}`);
        }

        if (inApiNotService.length === 0 && inServiceNotApi.length === 0) {
            console.log('✓ Perfect match! Both have the same excluded numbers.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

compareExclusions();
