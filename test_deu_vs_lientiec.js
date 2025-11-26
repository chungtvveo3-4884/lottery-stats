// Test Đều vs Liên Tiếp logic
const { findNextInSet, findPreviousInSet } = require('./utils/numberAnalysis');

// Test case 1: Tổng TT - Lùi Đều (isUniform=true)
const tongTTSet = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const tongTTMap = new Map(tongTTSet.map((v, i) => [v, i]));

console.log('=== Tổng TT - Lùi Đều (isUniform=true) ===');
console.log('Từ 5:', findPreviousInSet('5', tongTTSet, tongTTMap)); // Expect: '4'
console.log('Từ 2:', findPreviousInSet('2', tongTTSet, tongTTMap)); // Expect: '1'
console.log('Từ 1:', findPreviousInSet('1', tongTTSet, tongTTMap)); // Expect: '10' (wrap)

// Test case 2: Tổng TT - Lùi Liên Tiếp (isUniform=false)
// Simulate getAllGreaterOrSmaller
function getAllSmaller(currentValue, numberSet) {
    const sortedSet = [...numberSet].sort((a, b) => parseInt(a) - parseInt(b));
    const currentIndex = sortedSet.indexOf(currentValue);
    if (currentIndex === -1) return [];

    const smaller = sortedSet.slice(0, currentIndex);
    if (smaller.length === 0) {
        // Wrap: Return Max value ONLY
        return [sortedSet[sortedSet.length - 1]];
    } else {
        // Normal: Return ALL smaller values
        return smaller;
    }
}

console.log('\n=== Tổng TT - Lùi Liên Tiếp (isUniform=false) ===');
console.log('Từ 5:', getAllSmaller('5', tongTTSet)); // Expect: ['1','2','3','4']
console.log('Từ 2:', getAllSmaller('2', tongTTSet)); // Expect: ['1']
console.log('Từ 1:', getAllSmaller('1', tongTTSet)); // Expect: ['10'] (wrap, chỉ 1 giá trị)

// Test case 3: Đầu - Lùi Đều
const dauSet = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const dauMap = new Map(dauSet.map((v, i) => [v, i]));

console.log('\n=== Đầu - Lùi Đều (isUniform=true) ===');
console.log('Từ 5:', findPreviousInSet('5', dauSet, dauMap)); // Expect: '4'
console.log('Từ 1:', findPreviousInSet('1', dauSet, dauMap)); // Expect: '0'
console.log('Từ 0:', findPreviousInSet('0', dauSet, dauMap)); // Expect: '9' (wrap)

console.log('\n=== Đầu - Lùi Liên Tiếp (isUniform=false) ===');
console.log('Từ 5:', getAllSmaller('5', dauSet)); // Expect: ['0','1','2','3','4']
console.log('Từ 1:', getAllSmaller('1', dauSet)); // Expect: ['0']
console.log('Từ 0:', getAllSmaller('0', dauSet)); // Expect: ['9'] (wrap, chỉ 1 giá trị)
