// --- Định nghĩa các bộ số dạng mảng (Array) ---
const ALL_NUMBERS_ARRAY = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
const CHAN_CHAN_ARRAY = ALL_NUMBERS_ARRAY.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[1]) % 2 === 0);
const CHAN_LE_ARRAY = ALL_NUMBERS_ARRAY.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[1]) % 2 !== 0);
const LE_CHAN_ARRAY = ALL_NUMBERS_ARRAY.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[1]) % 2 === 0);
const LE_LE_ARRAY = ALL_NUMBERS_ARRAY.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[1]) % 2 !== 0);

// --- Xuất các bộ số dạng mảng ---
const SETS = {
    ALL: ALL_NUMBERS_ARRAY,
    CHAN_CHAN: CHAN_CHAN_ARRAY,
    CHAN_LE: CHAN_LE_ARRAY,
    LE_CHAN: LE_CHAN_ARRAY,
    LE_LE: LE_LE_ARRAY,
};

// --- Xuất các bộ số dạng Map để tra cứu nhanh (O(1)) ---
const MAPS = {
    ALL: new Map(ALL_NUMBERS_ARRAY.map(n => [n, true])),
    CHAN_CHAN: new Map(CHAN_CHAN_ARRAY.map(n => [n, true])),
    CHAN_LE: new Map(CHAN_LE_ARRAY.map(n => [n, true])),
    LE_CHAN: new Map(LE_CHAN_ARRAY.map(n => [n, true])),
    LE_LE: new Map(LE_LE_ARRAY.map(n => [n, true])),
};

/**
 * Tìm số hợp lệ tiếp theo trong một bộ số đã được sắp xếp.
 * @param {string} currentNumber - Số hiện tại (ví dụ: '22').
 * @param {Array<string>} numberSet - Bộ số được sắp xếp (ví dụ: SETS.CHAN_CHAN).
 * @param {Map<string, boolean>} numberMap - Map của bộ số để tra cứu.
 * @returns {string|null} - Số tiếp theo hoặc null nếu không có.
 */
function findNextInSet(currentNumber, numberSet, numberMap) {
    if (!numberMap.has(currentNumber)) return null;
    const currentIndex = numberSet.indexOf(currentNumber);
    return numberSet[currentIndex + 1] || null;
}

/**
 * Tìm số hợp lệ đứng trước trong một bộ số đã được sắp xếp.
 * @param {string} currentNumber - Số hiện tại (ví dụ: '22').
 * @param {Array<string>} numberSet - Bộ số được sắp xếp (ví dụ: SETS.CHAN_CHAN).
 * @param {Map<string, boolean>} numberMap - Map của bộ số để tra cứu.
 * @returns {string|null} - Số đứng trước hoặc null nếu không có.
 */
function findPreviousInSet(currentNumber, numberSet, numberMap) {
    if (!numberMap.has(currentNumber)) return null;
    const currentIndex = numberSet.indexOf(currentNumber);
    return numberSet[currentIndex - 1] || null;
}

module.exports = {
    SETS,
    MAPS,
    findNextInSet,
    findPreviousInSet,
};

