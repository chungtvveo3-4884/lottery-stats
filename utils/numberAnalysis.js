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

// =================================================================================================
// HÀM TÍNH TOÁN TỔNG VÀ HIỆU
// =================================================================================================

// Tính Tổng Mới (tổng 2 chữ số, kết quả từ 0-18)
const getTongMoi = (n) => {
    const num = parseInt(n, 10);
    return Math.floor(num / 10) + (num % 10);
};

// Tính Tổng Truyền Thống (lấy hàng đơn vị của tổng, 00=10, kết quả từ 1-10)
const getTongTT = (n) => {
    if (n === '00') return 10;
    const tongMoi = getTongMoi(n);
    const tongTT = tongMoi % 10;
    return tongTT === 0 ? 10 : tongTT;
};

// Tính Hiệu (giá trị dương)
const getHieu = (n) => {
    const num = parseInt(n, 10);
    return Math.abs(Math.floor(num / 10) - (num % 10));
};


// =================================================================================================
// TẠO CÁC BỘ SỐ (SETS) VÀ BẢN ĐỒ (MAPS) CHO TỔNG VÀ HIỆU
// =================================================================================================

// --- Thống kê theo TỔNG TRUYỀN THỐNG (TT) ---

// Các số cùng Tổng TT
for (let i = 1; i <= 10; i++) {
    const key = `TONG_TT_${i}`;
    SETS[key] = ALL_NUMBERS.filter(n => getTongTT(n) === i);
    MAPS[key] = new Map(SETS[key].map((n, index) => [n, index]));
    INDEX_MAPS[key] = new Map(SETS[key].map((item, index) => [item, index]));
}

// Các nhóm Tổng TT
SETS.TONG_TT_1_2 = [...SETS.TONG_TT_1, ...SETS.TONG_TT_2].sort();
MAPS.TONG_TT_1_2 = new Map(SETS.TONG_TT_1_2.map((n, index) => [n, index]));
INDEX_MAPS.TONG_TT_1_2 = new Map(SETS.TONG_TT_1_2.map((item, index) => [item, index]));

SETS.TONG_TT_3_4 = [...SETS.TONG_TT_3, ...SETS.TONG_TT_4].sort();
MAPS.TONG_TT_3_4 = new Map(SETS.TONG_TT_3_4.map((n, index) => [n, index]));
INDEX_MAPS.TONG_TT_3_4 = new Map(SETS.TONG_TT_3_4.map((item, index) => [item, index]));

SETS.TONG_TT_5_6 = [...SETS.TONG_TT_5, ...SETS.TONG_TT_6].sort();
MAPS.TONG_TT_5_6 = new Map(SETS.TONG_TT_5_6.map((n, index) => [n, index]));
INDEX_MAPS.TONG_TT_5_6 = new Map(SETS.TONG_TT_5_6.map((item, index) => [item, index]));

SETS.TONG_TT_7_8 = [...SETS.TONG_TT_7, ...SETS.TONG_TT_8].sort();
MAPS.TONG_TT_7_8 = new Map(SETS.TONG_TT_7_8.map((n, index) => [n, index]));
INDEX_MAPS.TONG_TT_7_8 = new Map(SETS.TONG_TT_7_8.map((item, index) => [item, index]));

SETS.TONG_TT_9_10 = [...SETS.TONG_TT_9, ...SETS.TONG_TT_10].sort();
MAPS.TONG_TT_9_10 = new Map(SETS.TONG_TT_9_10.map((n, index) => [n, index]));
INDEX_MAPS.TONG_TT_9_10 = new Map(SETS.TONG_TT_9_10.map((item, index) => [item, index]));

// Tổng TT Chẵn/Lẻ
SETS.TONG_TT_CHAN = ALL_NUMBERS.filter(n => getTongTT(n) % 2 === 0 || getTongTT(n) === 10);
MAPS.TONG_TT_CHAN = new Map(SETS.TONG_TT_CHAN.map((n, index) => [n, index]));
INDEX_MAPS.TONG_TT_CHAN = new Map(SETS.TONG_TT_CHAN.map((item, index) => [item, index]));

SETS.TONG_TT_LE = ALL_NUMBERS.filter(n => getTongTT(n) % 2 !== 0);
MAPS.TONG_TT_LE = new Map(SETS.TONG_TT_LE.map((n, index) => [n, index]));
INDEX_MAPS.TONG_TT_LE = new Map(SETS.TONG_TT_LE.map((item, index) => [item, index]));


// --- Thống kê theo TỔNG MỚI ---

// Các số cùng Tổng Mới
for (let i = 0; i <= 18; i++) {
    const key = `TONG_MOI_${i}`;
    SETS[key] = ALL_NUMBERS.filter(n => getTongMoi(n) === i);
    MAPS[key] = new Map(SETS[key].map((n, index) => [n, index]));
    INDEX_MAPS[key] = new Map(SETS[key].map((item, index) => [item, index]));
}

// Các nhóm Tổng Mới
SETS.TONG_MOI_0_3 = [...SETS.TONG_MOI_0, ...SETS.TONG_MOI_1, ...SETS.TONG_MOI_2, ...SETS.TONG_MOI_3].sort();
MAPS.TONG_MOI_0_3 = new Map(SETS.TONG_MOI_0_3.map((n, index) => [n, index]));
INDEX_MAPS.TONG_MOI_0_3 = new Map(SETS.TONG_MOI_0_3.map((item, index) => [item, index]));

SETS.TONG_MOI_4_6 = [...SETS.TONG_MOI_4, ...SETS.TONG_MOI_5, ...SETS.TONG_MOI_6].sort();
MAPS.TONG_MOI_4_6 = new Map(SETS.TONG_MOI_4_6.map((n, index) => [n, index]));
INDEX_MAPS.TONG_MOI_4_6 = new Map(SETS.TONG_MOI_4_6.map((item, index) => [item, index]));

SETS.TONG_MOI_7_9 = [...SETS.TONG_MOI_7, ...SETS.TONG_MOI_8, ...SETS.TONG_MOI_9].sort();
MAPS.TONG_MOI_7_9 = new Map(SETS.TONG_MOI_7_9.map((n, index) => [n, index]));
INDEX_MAPS.TONG_MOI_7_9 = new Map(SETS.TONG_MOI_7_9.map((item, index) => [item, index]));

SETS.TONG_MOI_10_12 = [...SETS.TONG_MOI_10, ...SETS.TONG_MOI_11, ...SETS.TONG_MOI_12].sort();
MAPS.TONG_MOI_10_12 = new Map(SETS.TONG_MOI_10_12.map((n, index) => [n, index]));
INDEX_MAPS.TONG_MOI_10_12 = new Map(SETS.TONG_MOI_10_12.map((item, index) => [item, index]));

SETS.TONG_MOI_13_15 = [...SETS.TONG_MOI_13, ...SETS.TONG_MOI_14, ...SETS.TONG_MOI_15].sort();
MAPS.TONG_MOI_13_15 = new Map(SETS.TONG_MOI_13_15.map((n, index) => [n, index]));
INDEX_MAPS.TONG_MOI_13_15 = new Map(SETS.TONG_MOI_13_15.map((item, index) => [item, index]));

SETS.TONG_MOI_16_18 = [...SETS.TONG_MOI_16, ...SETS.TONG_MOI_17, ...SETS.TONG_MOI_18].sort();
MAPS.TONG_MOI_16_18 = new Map(SETS.TONG_MOI_16_18.map((n, index) => [n, index]));
INDEX_MAPS.TONG_MOI_16_18 = new Map(SETS.TONG_MOI_16_18.map((item, index) => [item, index]));

// Tổng Mới Chẵn/Lẻ
SETS.TONG_MOI_CHAN = ALL_NUMBERS.filter(n => getTongMoi(n) % 2 === 0);
MAPS.TONG_MOI_CHAN = new Map(SETS.TONG_MOI_CHAN.map((n, index) => [n, index]));
INDEX_MAPS.TONG_MOI_CHAN = new Map(SETS.TONG_MOI_CHAN.map((item, index) => [item, index]));

SETS.TONG_MOI_LE = ALL_NUMBERS.filter(n => getTongMoi(n) % 2 !== 0);
MAPS.TONG_MOI_LE = new Map(SETS.TONG_MOI_LE.map((n, index) => [n, index]));
INDEX_MAPS.TONG_MOI_LE = new Map(SETS.TONG_MOI_LE.map((item, index) => [item, index]));


// --- Thống kê theo HIỆU ---

// Các số cùng Hiệu
for (let i = 0; i <= 9; i++) {
    const key = `HIEU_${i}`;
    SETS[key] = ALL_NUMBERS.filter(n => getHieu(n) === i);
    MAPS[key] = new Map(SETS[key].map((n, index) => [n, index]));
    INDEX_MAPS[key] = new Map(SETS[key].map((item, index) => [item, index]));
}

// Các nhóm Hiệu
SETS.HIEU_0_1 = [...SETS.HIEU_0, ...SETS.HIEU_1].sort();
MAPS.HIEU_0_1 = new Map(SETS.HIEU_0_1.map((n, index) => [n, index]));
INDEX_MAPS.HIEU_0_1 = new Map(SETS.HIEU_0_1.map((item, index) => [item, index]));

SETS.HIEU_2_3 = [...SETS.HIEU_2, ...SETS.HIEU_3].sort();
MAPS.HIEU_2_3 = new Map(SETS.HIEU_2_3.map((n, index) => [n, index]));
INDEX_MAPS.HIEU_2_3 = new Map(SETS.HIEU_2_3.map((item, index) => [item, index]));

SETS.HIEU_4_5 = [...SETS.HIEU_4, ...SETS.HIEU_5].sort();
MAPS.HIEU_4_5 = new Map(SETS.HIEU_4_5.map((n, index) => [n, index]));
INDEX_MAPS.HIEU_4_5 = new Map(SETS.HIEU_4_5.map((item, index) => [item, index]));

SETS.HIEU_6_7 = [...SETS.HIEU_6, ...SETS.HIEU_7].sort();
MAPS.HIEU_6_7 = new Map(SETS.HIEU_6_7.map((n, index) => [n, index]));
INDEX_MAPS.HIEU_6_7 = new Map(SETS.HIEU_6_7.map((item, index) => [item, index]));

SETS.HIEU_8_9 = [...SETS.HIEU_8, ...SETS.HIEU_9].sort();
MAPS.HIEU_8_9 = new Map(SETS.HIEU_8_9.map((n, index) => [n, index]));
INDEX_MAPS.HIEU_8_9 = new Map(SETS.HIEU_8_9.map((item, index) => [item, index]));

// Hiệu Chẵn/Lẻ
SETS.HIEU_CHAN = ALL_NUMBERS.filter(n => getHieu(n) % 2 === 0);
MAPS.HIEU_CHAN = new Map(SETS.HIEU_CHAN.map((n, index) => [n, index]));
INDEX_MAPS.HIEU_CHAN = new Map(SETS.HIEU_CHAN.map((item, index) => [item, index]));

SETS.HIEU_LE = ALL_NUMBERS.filter(n => getHieu(n) % 2 !== 0);
MAPS.HIEU_LE = new Map(SETS.HIEU_LE.map((n, index) => [n, index]));
INDEX_MAPS.HIEU_LE = new Map(SETS.HIEU_LE.map((item, index) => [item, index]));

// =================================================================================================
// TẠO CÁC BỘ SỐ TUẦN TỰ (FIX LỖI)
// =================================================================================================
// Các bộ số này dùng để xét chuỗi tiến/lùi đều của các giá trị Tổng/Hiệu

// --- Chuỗi giá trị Tổng TT ---
SETS.TONG_TT_SEQUENCE = Array.from({ length: 10 }, (_, i) => String(i + 1));
MAPS.TONG_TT_SEQUENCE = new Map(SETS.TONG_TT_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.TONG_TT_SEQUENCE = new Map(SETS.TONG_TT_SEQUENCE.map((item, index) => [index, item]));

SETS.TONG_TT_CHAN_SEQUENCE = ['2', '4', '6', '8', '10'];
MAPS.TONG_TT_CHAN_SEQUENCE = new Map(SETS.TONG_TT_CHAN_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.TONG_TT_CHAN_SEQUENCE = new Map(SETS.TONG_TT_CHAN_SEQUENCE.map((item, index) => [index, item]));

SETS.TONG_TT_LE_SEQUENCE = ['1', '3', '5', '7', '9'];
MAPS.TONG_TT_LE_SEQUENCE = new Map(SETS.TONG_TT_LE_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.TONG_TT_LE_SEQUENCE = new Map(SETS.TONG_TT_LE_SEQUENCE.map((item, index) => [index, item]));

// --- Chuỗi giá trị Tổng Mới ---
SETS.TONG_MOI_SEQUENCE = Array.from({ length: 19 }, (_, i) => String(i));
MAPS.TONG_MOI_SEQUENCE = new Map(SETS.TONG_MOI_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.TONG_MOI_SEQUENCE = new Map(SETS.TONG_MOI_SEQUENCE.map((item, index) => [index, item]));

SETS.TONG_MOI_CHAN_SEQUENCE = Array.from({ length: 10 }, (_, i) => String(i * 2));
MAPS.TONG_MOI_CHAN_SEQUENCE = new Map(SETS.TONG_MOI_CHAN_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.TONG_MOI_CHAN_SEQUENCE = new Map(SETS.TONG_MOI_CHAN_SEQUENCE.map((item, index) => [index, item]));

SETS.TONG_MOI_LE_SEQUENCE = Array.from({ length: 9 }, (_, i) => String(i * 2 + 1));
MAPS.TONG_MOI_LE_SEQUENCE = new Map(SETS.TONG_MOI_LE_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.TONG_MOI_LE_SEQUENCE = new Map(SETS.TONG_MOI_LE_SEQUENCE.map((item, index) => [index, item]));

// --- Chuỗi giá trị Hiệu ---
SETS.HIEU_SEQUENCE = Array.from({ length: 10 }, (_, i) => String(i));
MAPS.HIEU_SEQUENCE = new Map(SETS.HIEU_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.HIEU_SEQUENCE = new Map(SETS.HIEU_SEQUENCE.map((item, index) => [index, item]));

SETS.HIEU_CHAN_SEQUENCE = ['0', '2', '4', '6', '8'];
MAPS.HIEU_CHAN_SEQUENCE = new Map(SETS.HIEU_CHAN_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.HIEU_CHAN_SEQUENCE = new Map(SETS.HIEU_CHAN_SEQUENCE.map((item, index) => [index, item]));

SETS.HIEU_LE_SEQUENCE = ['1', '3', '5', '7', '9'];
MAPS.HIEU_LE_SEQUENCE = new Map(SETS.HIEU_LE_SEQUENCE.map((item, index) => [item, index]));
INDEX_MAPS.HIEU_LE_SEQUENCE = new Map(SETS.HIEU_LE_SEQUENCE.map((item, index) => [index, item]));

// [ADDED] TẠO CÁC BỘ SỐ CHO DẠNG CHẴN/LẺ CỦA TỔNG
const DANG_TYPES = ['CHAN_CHAN', 'CHAN_LE', 'LE_CHAN', 'LE_LE'];
const TONG_TYPES = { TONG_MOI: getTongMoi, TONG_TT: getTongTT };

Object.entries(TONG_TYPES).forEach(([tongType, getter]) => {
    const categorizations = { CHAN_CHAN: [], CHAN_LE: [], LE_CHAN: [], LE_LE: [] };

    ALL_NUMBERS.forEach(n => {
        const tong = getter(n);
        const tongStr = String(tong).padStart(2, '0');
        const dauChan = parseInt(tongStr[0]) % 2 === 0;
        const ditChan = parseInt(tongStr[1]) % 2 === 0;

        if (dauChan && ditChan) categorizations.CHAN_CHAN.push(n);
        else if (dauChan && !ditChan) categorizations.CHAN_LE.push(n);
        else if (!dauChan && ditChan) categorizations.LE_CHAN.push(n);
        else categorizations.LE_LE.push(n);
    });

    DANG_TYPES.forEach(dangType => {
        const key = `${tongType}_${dangType}`;
        SETS[key] = categorizations[dangType];
        MAPS[key] = new Map(SETS[key].map(item => [item, true]));
        INDEX_MAPS[key] = new Map(SETS[key].map((item, index) => [item, index]));
    });
});

module.exports = {
    SETS, MAPS, INDEX_MAPS, DIGIT_SETS, DIGIT_MAPS,
    findNextInSet, findPreviousInSet,
    getTongMoi, getTongTT, getHieu
};