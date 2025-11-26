
function getAllGreaterOrSmaller(currentValue, numberSet, isProgressive, wrap = true) {
    // Sort numberSet correctly based on numeric value
    const sortedSet = [...numberSet].sort((a, b) => parseInt(a) - parseInt(b));
    const currentIndex = sortedSet.indexOf(currentValue);

    if (currentIndex === -1) return [];

    let result = [];
    if (isProgressive) {
        // Tiến: Lấy tất cả số lớn hơn
        const greater = sortedSet.slice(currentIndex + 1);
        // Nếu đã ở cuối, wrap về đầu (nếu cho phép)
        if (greater.length === 0 && wrap) {
            // Forward wrap: Return Min value
            result = [sortedSet[0]];
        } else {
            result = greater;
        }
    } else {
        // Lùi: Lấy tất cả số nhỏ hơn
        const smaller = sortedSet.slice(0, currentIndex);
        // Nếu đã ở đầu, wrap về cuối (nếu cho phép)
        if (smaller.length === 0 && wrap) {
            // Backward wrap: Return Max value
            result = [sortedSet[sortedSet.length - 1]];
        } else {
            result = smaller;
        }
    }

    return result.filter(v => v !== currentValue);
}

const numberSet = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const currentVal = '1';
const isProgressive = false; // Lùi
const wrap = true;

const result = getAllGreaterOrSmaller(currentVal, numberSet, isProgressive, wrap);
console.log(`Current: ${currentVal}, Set: ${numberSet}`);
console.log(`Direction: Backward, Wrap: True`);
console.log(`Result: ${JSON.stringify(result)}`);

const currentVal2 = '10';
const isProgressive2 = true; // Tiến
const result2 = getAllGreaterOrSmaller(currentVal2, numberSet, isProgressive2, wrap);
console.log(`Current: ${currentVal2}, Direction: Forward, Wrap: True`);
console.log(`Result: ${JSON.stringify(result2)}`);
