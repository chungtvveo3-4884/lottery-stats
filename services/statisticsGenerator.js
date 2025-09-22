const fs = require('fs').promises;
const path = require('path');
const { SETS, MAPS, INDEX_MAPS, findNextInSet, findPreviousInSet } = require('../utils/numberAnalysis');

const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'xsmb-2-digits.json');
const OUTPUT_FILE_PATH = path.join(__dirname, '..', 'data', 'statistics', 'number_stats.json');

// --- CÁC HÀM TIỆN ÍCH ---

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
}

function isConsecutive(dateStr1, dateStr2) {
    if (!dateStr1 || !dateStr2) return false;
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    const oneDay = 24 * 60 * 60 * 1000;
    return d2.getTime() - d1.getTime() === oneDay;
}

function createStreakObject(data, dateMap, streak, typeSpecificData = {}) {
    if (!streak || streak.length < 2) return null;
    const firstItem = streak[0];
    const lastItem = streak[streak.length - 1];
    const startIndex = dateMap.get(firstItem.date);
    const endIndex = dateMap.get(lastItem.date);
    if (startIndex === undefined || endIndex === undefined) return null;
    const fullSequence = data.slice(startIndex, endIndex + 1);
    return {
        startDate: firstItem.date,
        endDate: lastItem.date,
        length: fullSequence.length,
        values: streak.map(item => item.value),
        dates: streak.map(item => item.date),
        fullSequence,
        ...typeSpecificData
    };
}

// --- CÁC HÀM TÌM CHUỖI ĐÃ SỬA LỖI ---

function findConsecutiveStreaks(data, dateMap) {
    const allStreaks = [];
    if (data.length < 2) return { description: "1 số về liên tiếp", streaks: [] };
    
    let currentStreak = [data[0]];
    for (let i = 1; i < data.length; i++) {
        if (data[i].value === currentStreak[currentStreak.length - 1].value && isConsecutive(data[i-1].date, data[i].date)) {
            currentStreak.push(data[i]);
        } else {
            if (currentStreak.length > 1) {
                allStreaks.push(createStreakObject(data, dateMap, currentStreak, { value: currentStreak[0].value }));
            }
            currentStreak = [data[i]];
        }
    }
    if (currentStreak.length > 1) {
        allStreaks.push(createStreakObject(data, dateMap, currentStreak, { value: currentStreak[0].value }));
    }
    return { description: "1 số về liên tiếp", streaks: allStreaks.filter(Boolean) };
}

function findConsecutiveTypeStreaks(data, dateMap, numberMap) {
    const allStreaks = [];
    if (data.length < 2) return { streaks: [] };

    let currentStreak = [];
    for (let i = 0; i < data.length; i++) {
        const currentItem = data[i];
        if (numberMap.has(currentItem.value)) {
            if (currentStreak.length === 0) {
                currentStreak.push(currentItem);
            } else {
                if(isConsecutive(currentStreak[currentStreak.length - 1].date, currentItem.date)){
                    currentStreak.push(currentItem);
                } else {
                    if (currentStreak.length > 1) {
                        allStreaks.push(createStreakObject(data, dateMap, currentStreak, { value: "Theo dạng" }));
                    }
                    currentStreak = [currentItem];
                }
            }
        } else {
            if (currentStreak.length > 1) {
                allStreaks.push(createStreakObject(data, dateMap, currentStreak, { value: "Theo dạng" }));
            }
            currentStreak = [];
        }
    }
    if (currentStreak.length > 1) {
        allStreaks.push(createStreakObject(data, dateMap, currentStreak, { value: "Theo dạng" }));
    }
    return { streaks: allStreaks.filter(Boolean) };
}

function findAlternatingStreaks(data, dateMap) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 2; i++) {
        const startValue = data[i].value;
        if (data[i + 1] && isConsecutive(data[i].date, data[i + 1].date) && isConsecutive(data[i + 1].date, data[i + 2].date) && startValue === data[i + 2].value) {
            let streak = [data[i], data[i + 2]];
            let lastIndex = i + 2;
            while (lastIndex < data.length - 2) {
                const nextPossibleIndex = lastIndex + 2;
                if (data[nextPossibleIndex] && data[lastIndex + 1] && isConsecutive(data[lastIndex].date, data[lastIndex + 1].date) && isConsecutive(data[lastIndex + 1].date, data[nextPossibleIndex].date)) {
                    if (startValue === data[nextPossibleIndex].value) {
                        streak.push(data[nextPossibleIndex]);
                        lastIndex = nextPossibleIndex;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            if (streak.length >= 2) {
                allStreaks.push(createStreakObject(data, dateMap, streak, { value: startValue, useStreakCountForLength: true }));
                i = lastIndex - 1;
            }
        }
    }
    return { description: "1 số về so le", streaks: allStreaks.filter(Boolean) };
}

/**
 * Finds "new" alternating streaks where the intermediate day is NOT of the same type.
 * @param {Map} numberMap - The map defining the number type to check for.
 */
function findAlternatingTypeStreaksNew(data, dateMap, numberMap) {
  const allStreaks = [];
  for (let i = 0; i < data.length - 2; i++) {
      const dayA = data[i];
      const dayB = data[i + 1];
      const dayC = data[i + 2];

      // Check if day A and C are the correct type, AND day B is NOT that type.
      if (isConsecutive(dayA.date, dayB.date) && isConsecutive(dayB.date, dayC.date) &&
          numberMap.has(dayA.value) &&
          !numberMap.has(dayB.value) && // This is the key "new" logic
          numberMap.has(dayC.value))
      {
          let streak = [dayA, dayC];
          let lastIndex = i + 2;

          // Continue searching to extend the streak
          while (lastIndex < data.length - 2) {
              const nextDay = data[lastIndex + 1];
              const nextStreakDay = data[lastIndex + 2];
              if (nextDay && nextStreakDay &&
                  isConsecutive(data[lastIndex].date, nextDay.date) &&
                  isConsecutive(nextDay.date, nextStreakDay.date) &&
                  !numberMap.has(nextDay.value) &&
                  numberMap.has(nextStreakDay.value))
              {
                  streak.push(nextStreakDay);
                  lastIndex += 2;
              } else {
                  break;
              }
          }

          if (streak.length >= 2) {
              allStreaks.push(createStreakObject(data, dateMap, streak, { value: "Theo dạng" }));
              i = lastIndex - 1; // Advance the main loop to avoid re-checking
          }
      }
  }
  return { streaks: allStreaks.filter(Boolean) };
}

// === HÀM MỚI CHO SO LE MỚI (1 SỐ) ===
function findAlternatingStreaksNew(data, dateMap) {
  const allStreaks = [];
  for (let i = 0; i < data.length - 2; i++) {
      const dayA = data[i];
      const dayB = data[i + 1];
      const dayC = data[i + 2];

      if (isConsecutive(dayA.date, dayB.date) && isConsecutive(dayB.date, dayC.date) &&
          dayA.value === dayC.value &&
          dayA.value !== dayB.value)
      {
          let streak = [dayA, dayC];
          let lastIndex = i + 2;

          while (lastIndex < data.length - 2) {
              const nextDay = data[lastIndex + 1];
              const nextStreakDay = data[lastIndex + 2];
              if (nextDay && nextStreakDay && isConsecutive(data[lastIndex].date, nextDay.date) && isConsecutive(nextDay.date, nextStreakDay.date) &&
                  dayA.value === nextStreakDay.value &&
                  dayA.value !== nextDay.value)
              {
                  streak.push(nextStreakDay);
                  lastIndex += 2;
              } else {
                  break;
              }
          }
          if (streak.length >= 2) {
              allStreaks.push(createStreakObject(data, dateMap, streak, { value: dayA.value }));
              i = lastIndex - 1;
          }
      }
  }
  return { description: "1 số về so le (mới)", streaks: allStreaks.filter(Boolean) };
}

function findAlternatingTypeStreaks(data, dateMap, numberMap) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 2; i++) {
        if (numberMap.has(data[i].value) && isConsecutive(data[i].date, data[i + 1].date) && isConsecutive(data[i + 1].date, data[i + 2].date) && numberMap.has(data[i + 2].value)) {
            let streak = [data[i], data[i + 2]];
            let lastIndex = i + 2;
            while (lastIndex < data.length - 2) {
                const nextPossibleIndex = lastIndex + 2;
                if (data[nextPossibleIndex] && data[lastIndex + 1] && isConsecutive(data[lastIndex].date, data[lastIndex + 1].date) && isConsecutive(data[lastIndex + 1].date, data[nextPossibleIndex].date) && numberMap.has(data[nextPossibleIndex].value)) {
                    streak.push(data[nextPossibleIndex]);
                    lastIndex = nextPossibleIndex;
                } else {
                    break;
                }
            }
            if (streak.length >= 2) {
                allStreaks.push(createStreakObject(data, dateMap, streak, { value: "Theo dạng", useStreakCountForLength: true }));
                i = lastIndex - 1;
            }
        }
    }
    return { streaks: allStreaks.filter(Boolean) };
}

// =============================================================================
// === SỬA LỖI LOGIC KIỂM TRA DẠNG SỐ TRONG CÁC HÀM TIẾN/LÙI DƯỚI ĐÂY ===
// =============================================================================

function findProgressiveStreaks(data, dateMap, isUniform, numberSet, indexMap, numberMap = MAPS.ALL) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 1; i++) {
        const startItem = data[i];
        if (!numberMap.has(startItem.value)) {
            continue; // Bỏ qua nếu số bắt đầu không thuộc dạng cần xét
        }
        
        let currentStreak = [startItem];
        for (let j = i; j < data.length - 1; j++) {
            const currentItem = data[j];
            const nextItem = data[j + 1];

            if (!isConsecutive(currentItem.date, nextItem.date) || !numberMap.has(nextItem.value)) {
                break; // Dừng chuỗi nếu ngày không liên tiếp hoặc số tiếp theo sai dạng
            }

            const condition = isUniform 
                ? (findNextInSet(currentItem.value, numberSet, indexMap) === nextItem.value) 
                : (parseInt(nextItem.value, 10) > parseInt(currentItem.value, 10));
            
            if (condition) {
                currentStreak.push(nextItem);
            } else {
                break;
            }
        }

        if (currentStreak.length > 1) {
            allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            i += currentStreak.length - 2;
        }
    }
    const desc = `Các số ${numberMap !== MAPS.ALL ? 'dạng' : ''} ${isUniform ? 'tiến ĐỀU' : 'tiến'} liên tiếp`;
    return { description: desc, streaks: allStreaks.filter(Boolean) };
}

function findRegressiveStreaks(data, dateMap, isUniform, numberSet, indexMap, numberMap = MAPS.ALL) {
    const allStreaks = [];
    for (let i = 0; i < data.length - 1; i++) {
        const startItem = data[i];
        if (!numberMap.has(startItem.value)) {
            continue;
        }
        
        let currentStreak = [startItem];
        for (let j = i; j < data.length - 1; j++) {
            const currentItem = data[j];
            const nextItem = data[j + 1];

            if (!isConsecutive(currentItem.date, nextItem.date) || !numberMap.has(nextItem.value)) {
                break;
            }

            const condition = isUniform 
                ? (findPreviousInSet(currentItem.value, numberSet, indexMap) === nextItem.value) 
                : (parseInt(nextItem.value, 10) < parseInt(currentItem.value, 10));
            
            if (condition) {
                currentStreak.push(nextItem);
            } else {
                break;
            }
        }

        if (currentStreak.length > 1) {
            allStreaks.push(createStreakObject(data, dateMap, currentStreak));
            i += currentStreak.length - 2;
        }
    }
    const desc = `Các số ${numberMap !== MAPS.ALL ? 'dạng' : ''} ${isUniform ? 'lùi ĐỀU' : 'lùi'} liên tiếp`;
    return { description: desc, streaks: allStreaks.filter(Boolean) };
}


function findAlternatingPairStreaks(data, dateMap) {
    // Logic cũ của bạn cho chức năng này có vẻ ổn, giữ nguyên
    const allStreaks = [];
    let i = 0;
    while (i < data.length - 3) {
        if (isConsecutive(data[i].date, data[i+1].date) && 
            isConsecutive(data[i+1].date, data[i+2].date) && 
            isConsecutive(data[i+2].date, data[i+3].date)) 
        {
            const a = data[i].value;
            const b = data[i + 1].value;
            if (a === data[i + 2].value && b === data[i + 3].value && a !== b) {
                let streak = [data[i], data[i + 1], data[i + 2], data[i + 3]];
                let j = i + 2;
                while (j < data.length - 3 && 
                       isConsecutive(data[j+1].date, data[j+2].date) &&
                       isConsecutive(data[j+2].date, data[j+3].date) &&
                       data[j].value === data[j + 2].value && 
                       data[j + 1].value === data[j + 3].value) {
                    streak.push(data[j + 2], data[j + 3]);
                    j += 2;
                }
                allStreaks.push(createStreakObject(data, dateMap, streak, { pair: [a, b] }));
                i = j;
            } else {
                i++;
            }
        } else {
            i++;
        }
    }
    return { description: "Cặp số về so le", streaks: allStreaks.filter(Boolean) };
}


function analyzeParityStreaks(data, dateMap, setKey, typeName) {
  const numberSet = SETS[setKey];
  const numberMap = MAPS[setKey];
  const indexMap = INDEX_MAPS[setKey];
  return {
      veLienTiep: { ...findConsecutiveTypeStreaks(data, dateMap, numberMap), description: `Số dạng ${typeName} về liên tiếp`},
      veSole: { ...findAlternatingTypeStreaks(data, dateMap, numberMap), description: `Số dạng ${typeName} về so le` },
       // --- ADD THIS LINE ---
      veSoleMoi: { ...findAlternatingTypeStreaksNew(data, dateMap, numberMap), description: `Số dạng ${typeName} về so le (mới)` },
       // --------------------
      tienLienTiep: { ...findProgressiveStreaks(data, dateMap, false, numberSet, indexMap, numberMap), description: `Số dạng ${typeName} tiến liên tiếp` },
      tienDeuLienTiep: { ...findProgressiveStreaks(data, dateMap, true, numberSet, indexMap, numberMap), description: `Số dạng ${typeName} tiến ĐỀU liên tiếp` },
      luiLienTiep: { ...findRegressiveStreaks(data, dateMap, false, numberSet, indexMap, numberMap), description: `Số dạng ${typeName} lùi liên tiếp` },
      luiDeuLienTiep: { ...findRegressiveStreaks(data, dateMap, true, numberSet, indexMap, numberMap), description: `Số dạng ${typeName} lùi ĐỀU liên tiếp` },
  };
}

async function generateNumberStats() {
    try {
        await fs.mkdir(path.dirname(OUTPUT_FILE_PATH), { recursive: true });
        const rawData = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        const originalData = JSON.parse(rawData);

        const lotteryData = originalData
            .map(item => (item.special === null || typeof item.special !== 'number' || isNaN(item.special)) ? null : {
                date: formatDate(item.date),
                value: String(item.special).padStart(2, '0')
            })
            .filter(item => item !== null)
            .sort((a, b) => parseDate(a.date) - parseDate(b.date));
            
        const dateToIndexMap = new Map(lotteryData.map((item, index) => [item.date, index]));

        console.log(`Đã xử lý và chuẩn hóa ${lotteryData.length} kết quả hợp lệ.`);
        console.log('Bắt đầu tính toán thống kê cho các dạng số...');

        const stats = {
          motSoVeLienTiep: findConsecutiveStreaks(lotteryData, dateToIndexMap),
          motSoVeSole: findAlternatingStreaks(lotteryData, dateToIndexMap),
          motSoVeSoleMoi: findAlternatingStreaksNew(lotteryData, dateToIndexMap),
          cacSoTienLienTiep: findProgressiveStreaks(lotteryData, dateToIndexMap, false, SETS.ALL, INDEX_MAPS.ALL),
          cacSoTienDeuLienTiep: findProgressiveStreaks(lotteryData, dateToIndexMap, true, SETS.ALL, INDEX_MAPS.ALL),
          cacSoLuiLienTiep: findRegressiveStreaks(lotteryData, dateToIndexMap, false, SETS.ALL, INDEX_MAPS.ALL),
          cacSoLuiDeuLienTiep: findRegressiveStreaks(lotteryData, dateToIndexMap, true, SETS.ALL, INDEX_MAPS.ALL),
          capSoVeSoLe: findAlternatingPairStreaks(lotteryData, dateToIndexMap),
          chanChan: analyzeParityStreaks(lotteryData, dateToIndexMap, 'CHAN_CHAN', 'Chẵn-Chẵn'),
          chanLe: analyzeParityStreaks(lotteryData, dateToIndexMap, 'CHAN_LE', 'Chẵn-Lẻ'),
          leChan: analyzeParityStreaks(lotteryData, dateToIndexMap, 'LE_CHAN', 'Lẻ-Chẵn'),
          leLe: analyzeParityStreaks(lotteryData, dateToIndexMap, 'LE_LE', 'Lẻ-Lẻ'),
      };

        await fs.writeFile(OUTPUT_FILE_PATH, JSON.stringify(stats, null, 2));
        console.log(`✅ Đã lưu kết quả thống kê số vào: ${OUTPUT_FILE_PATH}`);

    } catch (error) {
        console.error("❌ Lỗi khi tạo file thống kê số:", error);
    }
}

module.exports = generateNumberStats;