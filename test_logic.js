// Test predictNextInSequence logic directly
const { SETS } = require('./utils/numberAnalysis');

// Simulate the logic
const category = 'dau_nho_dit_nho';
const subcategory = 'tienDeuLienTiep';
const lastValue = '04';

console.log('Testing predictNextInSequence logic:');
console.log(`Category: ${category}`);
console.log(`Subcategory: ${subcategory}`);
console.log(`Last value: ${lastValue}`);

// Get sequence
const numberSet = SETS['DAU_NHO_DIT_NHO'];
console.log(`\nNumber set (first 10):`, numberSet.slice(0, 10));
console.log(`Number set length: ${numberSet.length}`);

// Extract value
const strVal = String(lastValue).padStart(2, '0');
const compositePatterns = ['dau_nho_dit_nho', 'dau_nho_dit_to', 'dau_to_dit_nho', 'dau_to_dit_to'];
const lastValueToPredict = compositePatterns.includes(category) ? strVal : strVal[1];
console.log(`\nLast value to predict: ${lastValueToPredict}`);

// Find next
const isProgressive = subcategory.includes('tien');
const isUniform = subcategory.includes('Deu');
console.log(`Is progressive: ${isProgressive}`);
console.log(`Is uniform: ${isUniform}`);

// For uniform, find next in set
if (isUniform) {
    const indexMap = new Map(numberSet.map((v, i) => [v, i]));
    const currentIndex = indexMap.get(lastValueToPredict);
    console.log(`\nCurrent index: ${currentIndex}`);

    if (currentIndex !== undefined) {
        const nextIndex = (currentIndex + 1) % numberSet.length;
        const nextValue = numberSet[nextIndex];
        console.log(`Next index: ${nextIndex}`);
        console.log(`Next value: ${nextValue}`);
    }
}
