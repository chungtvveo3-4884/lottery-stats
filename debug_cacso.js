const { SETS, findNextInSet, findPreviousInSet, INDEX_MAPS, getTongTT, getTongMoi, getHieu } = require('./utils/numberAnalysis');

// Test predictNextInSequence logic for "cacSoLuiDeuLienTiep"
const category = 'cacSo'; // Assuming this is the category
const subcategory = 'luiDeuLienTiep';
const lastValue = '50'; // Example

console.log('Testing:', category, subcategory, 'lastValue:', lastValue);

// From predictNextInSequence logic
const isProgressive = subcategory.includes('tien'); // false
const isUniform = subcategory.includes('Deu'); // true

console.log('isProgressive:', isProgressive);
console.log('isUniform:', isUniform);

// What is the numberSet for 'cacSo'?
// Looking at getSequence logic...
// 'cacSo' doesn't match any specific pattern
// So it would return null or fall back to getNumbersFromCategory

console.log('\nChecking what getSequence would return for "cacSo"...');
console.log('Does it start with tong_tt_?', category.startsWith('tong_tt_'));
console.log('Does it start with dau_?', category.startsWith('dau_'));

// If getSequence returns null, predictNextInSequence returns getNumbersFromCategory(category)
// But 'cacSo' is not a valid SETS key

console.log('\nSETS keys:', Object.keys(SETS).filter(k => k.toLowerCase().includes('cac')));
