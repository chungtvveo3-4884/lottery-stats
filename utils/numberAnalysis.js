/**
 * file này định nghĩa tất cả các bộ số cần thiết cho việc phân tích thống kê.
 * Nó là "bộ não" cung cấp dữ liệu nền cho các file generator.
 */

// Tạo mảng số từ "00" đến "99"
const ALL_NUMBERS = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));

// --- BỘ SỐ CHO ĐẦU VÀ ĐÍT (0-9) ---
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const CHAN_DIGITS = ['0', '2', '4', '6', '8'];
const LE_DIGITS = ['1', '3', '5', '7', '9'];
const NHO_DIGITS = ['0', '1', '2', '3', '4'];
const TO_DIGITS = ['5', '6', '7', '8', '9'];
const CHAN_LON_HON_4_DIGITS = ['6', '8'];
const CHAN_NHO_HON_4_DIGITS = ['0', '2']; // Bỏ số 4 vì là < 4
const LE_LON_HON_5_DIGITS = ['7', '9'];
const LE_NHO_HON_5_DIGITS = ['1', '3']; // Bỏ số 5 vì là < 5

// --- PHÂN LOẠI CƠ BẢN ---
const DAU_CHAN = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0);
const DAU_LE = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0);
const DIT_CHAN = ALL_NUMBERS.filter(n => parseInt(n[1]) % 2 === 0);
const DIT_LE = ALL_NUMBERS.filter(n => parseInt(n[1]) % 2 !== 0);

const DAU_TO = ALL_NUMBERS.filter(n => parseInt(n[0]) >= 5);
const DAU_NHO = ALL_NUMBERS.filter(n => parseInt(n[0]) < 5);
const DIT_TO = ALL_NUMBERS.filter(n => parseInt(n[1]) >= 5);
const DIT_NHO = ALL_NUMBERS.filter(n => parseInt(n[1]) < 5);

// --- PHÂN LOẠI THEO DẠNG SỐ ---
const CHAN_CHAN = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[1]) % 2 === 0);
const CHAN_LE = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[1]) % 2 !== 0);
const LE_CHAN = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[1]) % 2 === 0);
const LE_LE = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[1]) % 2 !== 0);

// --- PHÂN LOẠI KẾT HỢP ĐẦU - ĐÍT ---
const DAU_TO_DIT_TO = ALL_NUMBERS.filter(n => parseInt(n[0]) >= 5 && parseInt(n[1]) >= 5);
const DAU_TO_DIT_NHO = ALL_NUMBERS.filter(n => parseInt(n[0]) >= 5 && parseInt(n[1]) < 5);
const DAU_NHO_DIT_TO = ALL_NUMBERS.filter(n => parseInt(n[0]) < 5 && parseInt(n[1]) >= 5);
const DAU_NHO_DIT_NHO = ALL_NUMBERS.filter(n => parseInt(n[0]) < 5 && parseInt(n[1]) < 5);

// --- PHÂN LOẠI ĐẦU/ĐÍT CHẴN/LẺ KÈM ĐIỀU KIỆN LỚN/NHỎ ---
const DAU_CHAN_LON_HON_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) > 4); // {6, 8}
const DAU_CHAN_NHO_HON_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) < 4); // {0, 2}
const DIT_CHAN_LON_HON_4 = ALL_NUMBERS.filter(n => parseInt(n[1]) % 2 === 0 && parseInt(n[1]) > 4); // {6, 8}
const DIT_CHAN_NHO_HON_4 = ALL_NUMBERS.filter(n => parseInt(n[1]) % 2 === 0 && parseInt(n[1]) < 4); // {0, 2}

const DAU_LE_LON_HON_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) > 5); // {7, 9}
const DAU_LE_NHO_HON_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) < 5); // {1, 3}
const DIT_LE_LON_HON_5 = ALL_NUMBERS.filter(n => parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) > 5); // {7, 9}
const DIT_LE_NHO_HON_5 = ALL_NUMBERS.filter(n => parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) < 5); // {1, 3}

// --- PHÂN LOẠI KẾT HỢP PHỨC TẠP ---
const DAU_CHAN_LON_4_DIT_CHAN_LON_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) > 4 && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) > 4);
const DAU_CHAN_LON_4_DIT_CHAN_NHO_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) > 4 && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) < 4);
const DAU_CHAN_NHO_4_DIT_CHAN_LON_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) < 4 && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) > 4);
const DAU_CHAN_NHO_4_DIT_CHAN_NHO_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) < 4 && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) < 4);

const DAU_CHAN_LON_4_DIT_LE_LON_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) > 4 && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) > 5);
const DAU_CHAN_LON_4_DIT_LE_NHO_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) > 4 && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) < 5);
const DAU_CHAN_NHO_4_DIT_LE_LON_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) < 4 && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) > 5);
const DAU_CHAN_NHO_4_DIT_LE_NHO_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 === 0 && parseInt(n[0]) < 4 && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) < 5);

const DAU_LE_LON_5_DIT_CHAN_LON_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) > 5 && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) > 4);
const DAU_LE_LON_5_DIT_CHAN_NHO_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) > 5 && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) < 4);
const DAU_LE_NHO_5_DIT_CHAN_LON_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) < 5 && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) > 4);
const DAU_LE_NHO_5_DIT_CHAN_NHO_4 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) < 5 && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) < 4);

const DAU_LE_LON_5_DIT_LE_LON_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) > 5 && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) > 5);
const DAU_LE_LON_5_DIT_LE_NHO_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) > 5 && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) < 5);
const DAU_LE_NHO_5_DIT_LE_LON_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) < 5 && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) > 5);
const DAU_LE_NHO_5_DIT_LE_NHO_5 = ALL_NUMBERS.filter(n => parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) < 5 && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) < 5);

// --- Dạng Đầu/Đít cụ thể ---
const DAU_4_DIT_CHAN_LON_4 = ALL_NUMBERS.filter(n => n.startsWith('4') && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) > 4);
const DAU_4_DIT_CHAN_NHO_4 = ALL_NUMBERS.filter(n => n.startsWith('4') && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) < 4);
const DAU_4_DIT_LE_LON_5 = ALL_NUMBERS.filter(n => n.startsWith('4') && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) > 5);
const DAU_4_DIT_LE_NHO_5 = ALL_NUMBERS.filter(n => n.startsWith('4') && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) < 5);

const DAU_5_DIT_CHAN_LON_4 = ALL_NUMBERS.filter(n => n.startsWith('5') && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) > 4);
const DAU_5_DIT_CHAN_NHO_4 = ALL_NUMBERS.filter(n => n.startsWith('5') && parseInt(n[1]) % 2 === 0 && parseInt(n[1]) < 4);
const DAU_5_DIT_LE_LON_5 = ALL_NUMBERS.filter(n => n.startsWith('5') && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) > 5);
const DAU_5_DIT_LE_NHO_5 = ALL_NUMBERS.filter(n => n.startsWith('5') && parseInt(n[1]) % 2 !== 0 && parseInt(n[1]) < 5);

const DIT_4_DAU_CHAN_LON_4 = ALL_NUMBERS.filter(n => n.endsWith('4') && parseInt(n[0]) % 2 === 0 && parseInt(n[0]) > 4);
const DIT_4_DAU_CHAN_NHO_4 = ALL_NUMBERS.filter(n => n.endsWith('4') && parseInt(n[0]) % 2 === 0 && parseInt(n[0]) < 4);
const DIT_4_DAU_LE_LON_5 = ALL_NUMBERS.filter(n => n.endsWith('4') && parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) > 5);
const DIT_4_DAU_LE_NHO_5 = ALL_NUMBERS.filter(n => n.endsWith('4') && parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) < 5);

const DIT_5_DAU_CHAN_LON_4 = ALL_NUMBERS.filter(n => n.endsWith('5') && parseInt(n[0]) % 2 === 0 && parseInt(n[0]) > 4);
const DIT_5_DAU_CHAN_NHO_4 = ALL_NUMBERS.filter(n => n.endsWith('5') && parseInt(n[0]) % 2 === 0 && parseInt(n[0]) < 4);
const DIT_5_DAU_LE_LON_5 = ALL_NUMBERS.filter(n => n.endsWith('5') && parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) > 5);
const DIT_5_DAU_LE_NHO_5 = ALL_NUMBERS.filter(n => n.endsWith('5') && parseInt(n[0]) % 2 !== 0 && parseInt(n[0]) < 5);


// --- EXPORTS ---

const SETS = {
    ALL: ALL_NUMBERS, CHAN_CHAN, CHAN_LE, LE_CHAN, LE_LE,
    DAU_CHAN, DAU_LE, DIT_CHAN, DIT_LE,
    DAU_TO, DAU_NHO, DIT_TO, DIT_NHO,
    DAU_TO_DIT_TO, DAU_TO_DIT_NHO, DAU_NHO_DIT_TO, DAU_NHO_DIT_NHO,
    DAU_CHAN_LON_HON_4, DAU_CHAN_NHO_HON_4, DIT_CHAN_LON_HON_4, DIT_CHAN_NHO_HON_4,
    DAU_LE_LON_HON_5, DAU_LE_NHO_HON_5, DIT_LE_LON_HON_5, DIT_LE_NHO_HON_5,
    DAU_CHAN_LON_4_DIT_CHAN_LON_4, DAU_CHAN_LON_4_DIT_CHAN_NHO_4, DAU_CHAN_NHO_4_DIT_CHAN_LON_4, DAU_CHAN_NHO_4_DIT_CHAN_NHO_4,
    DAU_CHAN_LON_4_DIT_LE_LON_5, DAU_CHAN_LON_4_DIT_LE_NHO_5, DAU_CHAN_NHO_4_DIT_LE_LON_5, DAU_CHAN_NHO_4_DIT_LE_NHO_5,
    DAU_LE_LON_5_DIT_CHAN_LON_4, DAU_LE_LON_5_DIT_CHAN_NHO_4, DAU_LE_NHO_5_DIT_CHAN_LON_4, DAU_LE_NHO_5_DIT_CHAN_NHO_4,
    DAU_LE_LON_5_DIT_LE_LON_5, DAU_LE_LON_5_DIT_LE_NHO_5, DAU_LE_NHO_5_DIT_LE_LON_5, DAU_LE_NHO_5_DIT_LE_NHO_5,
    DAU_4_DIT_CHAN_LON_4, DAU_4_DIT_CHAN_NHO_4, DAU_4_DIT_LE_LON_5, DAU_4_DIT_LE_NHO_5,
    DAU_5_DIT_CHAN_LON_4, DAU_5_DIT_CHAN_NHO_4, DAU_5_DIT_LE_LON_5, DAU_5_DIT_LE_NHO_5,
    DIT_4_DAU_CHAN_LON_4, DIT_4_DAU_CHAN_NHO_4, DIT_4_DAU_LE_LON_5, DIT_4_DAU_LE_NHO_5,
    DIT_5_DAU_CHAN_LON_4, DIT_5_DAU_CHAN_NHO_4, DIT_5_DAU_LE_LON_5, DIT_5_DAU_LE_NHO_5,
    DIGITS, CHAN_DIGITS, LE_DIGITS, NHO_DIGITS, TO_DIGITS,
    CHAN_LON_HON_4_DIGITS, CHAN_NHO_HON_4_DIGITS, LE_LON_HON_5_DIGITS, LE_NHO_HON_5_DIGITS
};

const MAPS = {};
const INDEX_MAPS = {}; 
for (const key in SETS) {
    MAPS[key] = new Map(SETS[key].map(item => [item, true]));
    INDEX_MAPS[key] = new Map(SETS[key].map((item, index) => [item, index]));
}

const DIGIT_SETS = { DIGITS, CHAN_DIGITS, LE_DIGITS, NHO_DIGITS, TO_DIGITS, CHAN_LON_HON_4_DIGITS, CHAN_NHO_HON_4_DIGITS, LE_LON_HON_5_DIGITS, LE_NHO_HON_5_DIGITS };
const DIGIT_MAPS = {};
for (const key in DIGIT_SETS) {
    DIGIT_MAPS[key] = new Map(DIGIT_SETS[key].map((num, index) => [num, index]));
}

function findNextInSet(currentNumber, numberSet, numberMap) {
    const currentIndex = numberMap.get(currentNumber);
    if (currentIndex !== undefined && currentIndex < numberSet.length - 1) {
        return numberSet[currentIndex + 1];
    }
    return null;
}

function findPreviousInSet(currentNumber, numberSet, numberMap) {
    const currentIndex = numberMap.get(currentNumber);
    if (currentIndex !== undefined && currentIndex > 0) {
        return numberSet[currentIndex - 1];
    }
    return null;
}

module.exports = {
    SETS,
    MAPS,
    INDEX_MAPS,
    DIGITS, CHAN_DIGITS, LE_DIGITS,
    DIGIT_SETS,
    DIGIT_MAPS,
    findNextInSet,
    findPreviousInSet
};