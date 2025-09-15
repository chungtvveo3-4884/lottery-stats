/**
 * File này định nghĩa tất cả các bộ số và các hàm tiện ích để phân tích.
 * Đây là "bộ não" trung tâm cho các module thống kê.
 */

// --- BỘ SỐ CƠ BẢN ---
const ALL_NUMBERS = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
const ALL_HEADS = Array.from({ length: 10 }, (_, i) => i.toString());
const ALL_TAILS = Array.from({ length: 10 }, (_, i) => i.toString());

// --- BỘ SỐ THEO TÍNH CHẤT ---
const CHAN_CHAN_NUMBERS = ALL_NUMBERS.filter(n => n[0] % 2 === 0 && n[1] % 2 === 0);
const CHAN_LE_NUMBERS = ALL_NUMBERS.filter(n => n[0] % 2 === 0 && n[1] % 2 !== 0);
const LE_CHAN_NUMBERS = ALL_NUMBERS.filter(n => n[0] % 2 !== 0 && n[1] % 2 === 0);
const LE_LE_NUMBERS = ALL_NUMBERS.filter(n => n[0] % 2 !== 0 && n[1] % 2 !== 0);

// Đầu / Đít
const DAU_CHAN = ['0', '2', '4', '6', '8'];
const DAU_LE = ['1', '3', '5', '7', '9'];
const DIT_CHAN = ['0', '2', '4', '6', '8'];
const DIT_LE = ['1', '3', '5', '7', '9'];

// To / Nhỏ
const DAU_TO = ['5', '6', '7', '8', '9'];
const DAU_NHO = ['0', '1', '2', '3', '4'];
const DIT_TO = ['5', '6', '7', '8', '9'];
const DIT_NHO = ['0', '1', '2', '3', '4'];

// --- BỘ SỐ KẾT HỢP ---
const DAU_TO_DIT_TO = ALL_NUMBERS.filter(n => DAU_TO.includes(n[0]) && DIT_TO.includes(n[1]));
const DAU_TO_DIT_NHO = ALL_NUMBERS.filter(n => DAU_TO.includes(n[0]) && DIT_NHO.includes(n[1]));
const DAU_NHO_DIT_TO = ALL_NUMBERS.filter(n => DAU_NHO.includes(n[0]) && DIT_TO.includes(n[1]));
const DAU_NHO_DIT_NHO = ALL_NUMBERS.filter(n => DAU_NHO.includes(n[0]) && DIT_NHO.includes(n[1]));

// Đầu Chẵn/Lẻ kết hợp To/Nhỏ
const DAU_CHAN_LON_4 = ['6', '8'];
const DAU_CHAN_NHO_4 = ['0', '2', '4'];
const DAU_LE_LON_5 = ['7', '9'];
const DAU_LE_NHO_5 = ['1', '3', '5'];

// Đít Chẵn/Lẻ kết hợp To/Nhỏ
const DIT_CHAN_LON_4 = ['6', '8'];
const DIT_CHAN_NHO_4 = ['0', '2', '4'];
const DIT_LE_LON_5 = ['7', '9'];
const DIT_LE_NHO_5 = ['1', '3', '5'];

// Bộ số kết hợp phức tạp
const DAU_4_DIT_CHAN_LON_4 = ALL_NUMBERS.filter(n => n[0] === '4' && DIT_CHAN_LON_4.includes(n[1]));
const DAU_4_DIT_CHAN_NHO_4 = ALL_NUMBERS.filter(n => n[0] === '4' && DIT_CHAN_NHO_4.includes(n[1]));
// ... và tiếp tục định nghĩa các bộ số phức tạp còn lại theo quy tắc tương tự ...

// TỔNG HỢP TẤT CẢ CÁC BỘ DỮ LIỆU DẠNG MẢNG (ARRAY)
const SETS = {
    ALL: ALL_NUMBERS,
    ALL_HEADS,
    ALL_TAILS,
    CHAN_CHAN: CHAN_CHAN_NUMBERS,
    CHAN_LE: CHAN_LE_NUMBERS,
    LE_CHAN: LE_CHAN_NUMBERS,
    LE_LE: LE_LE_NUMBERS,
    DAU_CHAN, DAU_LE, DIT_CHAN, DIT_LE,
    DAU_TO, DAU_NHO, DIT_TO, DIT_NHO,
    DAU_TO_DIT_TO, DAU_TO_DIT_NHO, DAU_NHO_DIT_TO, DAU_NHO_DIT_NHO,
    DAU_CHAN_LON_4_NUMS: ALL_NUMBERS.filter(n => DAU_CHAN_LON_4.includes(n[0])),
    DAU_CHAN_NHO_4_NUMS: ALL_NUMBERS.filter(n => DAU_CHAN_NHO_4.includes(n[0])),
    DAU_LE_LON_5_NUMS: ALL_NUMBERS.filter(n => DAU_LE_LON_5.includes(n[0])),
    DAU_LE_NHO_5_NUMS: ALL_NUMBERS.filter(n => DAU_LE_NHO_5.includes(n[0])),
    DIT_CHAN_LON_4_NUMS: ALL_NUMBERS.filter(n => DIT_CHAN_LON_4.includes(n[1])),
    DIT_CHAN_NHO_4_NUMS: ALL_NUMBERS.filter(n => DIT_CHAN_NHO_4.includes(n[1])),
    DIT_LE_LON_5_NUMS: ALL_NUMBERS.filter(n => DIT_LE_LON_5.includes(n[1])),
    DIT_LE_NHO_5_NUMS: ALL_NUMBERS.filter(n => DIT_LE_NHO_5.includes(n[1])),
};

// TẠO CÁC CẤU TRÚC MAP ĐỂ TRA CỨU NHANH
const MAPS = {}; // Dùng để kiểm tra sự tồn tại (giống Set)
const INDEX_MAPS = {}; // Dùng để tra cứu chỉ số (index)

for (const key in SETS) {
    MAPS[key] = new Map(SETS[key].map(val => [val, true]));
    INDEX_MAPS[key] = new Map(SETS[key].map((val, i) => [val, i]));
}

/**
 * Tìm phần tử tiếp theo trong một bộ số đã được sắp xếp.
 * @param {string} value - Giá trị hiện tại.
 * @param {Array<string>} setArray - Mảng (bộ số) đã được sắp xếp.
 * @param {Map<string, number>} indexMap - Map tra cứu chỉ số của giá trị.
 * @returns {string|null} - Giá trị tiếp theo hoặc null.
 */
function findNextInSet(value, setArray, indexMap) {
    if (!indexMap.has(value)) return null;
    const index = indexMap.get(value);
    if (index === undefined || index >= setArray.length - 1) {
        return null;
    }
    return setArray[index + 1];
}

/**
 * Tìm phần tử phía trước trong một bộ số đã được sắp xếp.
 * @param {string} value - Giá trị hiện tại.
 * @param {Array<string>} setArray - Mảng (bộ số) đã được sắp xếp.
 * @param {Map<string, number>} indexMap - Map tra cứu chỉ số của giá trị.
 * @returns {string|null} - Giá trị phía trước hoặc null.
 */
function findPreviousInSet(value, setArray, indexMap) {
    if (!indexMap.has(value)) return null;
    const index = indexMap.get(value);
    if (index === undefined || index <= 0) {
        return null;
    }
    return setArray[index - 1];
}


module.exports = {
    SETS,
    MAPS,
    INDEX_MAPS,
    findNextInSet,
    findPreviousInSet
};

