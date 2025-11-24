const { SETS, MAPS, findNextInSet } = require('./utils/numberAnalysis');

// 1. Verify Sets
console.log("Checking DAU_DIT_TIEN sets for 03 and 04...");
for (let i = 0; i < 10; i++) {
    const key = `DAU_DIT_TIEN_${i}`;
    const set = SETS[key];
    const has03 = set.includes('03');
    const has04 = set.includes('04');
    if (has03 || has04) {
        console.log(`${key}: Has 03? ${has03}, Has 04? ${has04}`);
        console.log(`Set content: ${set.join(', ')}`);
    }
}

// 2. Simulate findProgressiveStreaks logic
console.log("\nSimulating logic for 03 -> 04...");
const data = [
    { date: '01/01/2024', value: '03' },
    { date: '02/01/2024', value: '04' }
];

function isConsecutive(d1, d2) { return true; } // Mock

function checkLogic(setName) {
    const set = SETS[setName];
    const map = MAPS[setName];
    const typeCondition = (item) => map.has(item.value);

    // Check item 0 (03)
    if (!typeCondition(data[0])) {
        // console.log(`${setName}: 03 not in set`);
        return;
    }

    // Check item 1 (04)
    if (!typeCondition(data[1])) {
        console.log(`${setName}: 03 in set, but 04 NOT in set. Logic stops.`);
        return;
    }

    console.log(`${setName}: BOTH 03 and 04 in set!`);

    // Check Uniform
    const val1 = '03';
    const val2 = '04';
    const nextInSet = findNextInSet(val1, set, INDEX_MAPS[setName] || new Map(set.map((v, i) => [v, i])));
    console.log(`${setName}: Next of 03 is ${nextInSet}. Is 04? ${nextInSet === val2}`);
}

// Run for all sets
/*
// Need INDEX_MAPS
const INDEX_MAPS = {};
for (const key in SETS) {
    if (Array.isArray(SETS[key])) {
        INDEX_MAPS[key] = new Map(SETS[key].map((item, index) => [item, index]));
    }
}
*/
// Actually numberAnalysis exports INDEX_MAPS, but I need to make sure it's populated.
// The require above should handle it if numberAnalysis does it.
// Let's check if INDEX_MAPS is populated in the require.
// numberAnalysis.js populates MAPS and INDEX_MAPS at the end.

for (let i = 0; i < 10; i++) {
    checkLogic(`DAU_DIT_TIEN_${i}`);
}
