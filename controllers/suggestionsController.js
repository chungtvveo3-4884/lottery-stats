const statisticsService = require('../services/statisticsService');
const { SETS, findNextInSet, findPreviousInSet, INDEX_MAPS, getTongTT, getTongMoi, getHieu } = require('../utils/numberAnalysis');

exports.getSuggestions = async (req, res) => {
    try {
        // Get config from query params with defaults
        const GAP_THRESHOLD_PERCENT = parseFloat(req.query.gapThreshold) || 0.15;
        const USE_MIN_GAP = req.query.useMinGap !== 'false'; // default true

        const quickStats = await statisticsService.getQuickStats();
        const latestDate = await statisticsService.getLatestDate();
        const excludedNumbers = new Set();
        const explanations = [];

        for (const key in quickStats) {
            const stat = quickStats[key];

            // Remove strict date check to match frontend display
            if (!stat.current) continue;

            const currentLen = stat.current.length;
            const [category, subcategory] = key.split(':');
            const isSoLePattern = subcategory === 'veSole' || subcategory === 'veSoleMoi';

            // For so le patterns, targetLen = currentLen + 2 (skip every other day)
            // For other patterns, targetLen = currentLen + 1
            const targetLen = isSoLePattern ? currentLen + 2 : currentLen + 1;

            const gapInfo = stat.gapStats ? stat.gapStats[targetLen] : null;
            const recordLen = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;

            // 1. Kiểm tra nếu đã đạt kỷ lục -> Loại
            if (currentLen >= recordLen && recordLen > 0) {
                addExcludedNumber(stat, key, `Chuỗi hiện tại(${currentLen} ngày) đã đạt kỷ lục dài nhất(${recordLen} ngày).Xác suất phá kỷ lục là THẤP.`);
            }

            // 1.5. Kiểm tra nếu gần đạt kỷ lục (>= 80%) -> Loại (NEW)
            else if (currentLen >= recordLen * 0.8 && recordLen > 2) {
                const percentage = Math.round(currentLen / recordLen * 100);
                addExcludedNumber(stat, key,
                    `Chuỗi hiện tại(${currentLen} ngày) đã đạt ${percentage}% kỷ lục(${recordLen} ngày).Xác suất phá kỷ lục là THẤP.`
                );
            }

            // 2. Kiểm tra quy tắc Gap - Sử dụng config
            if (gapInfo) {
                let shouldExclude = false;
                let explanation = '';

                // Check if lastGap is abnormally low (minGap OR threshold% avgGap)
                const minGapFailed = USE_MIN_GAP && gapInfo.minGap !== null && gapInfo.lastGap < gapInfo.minGap;
                const avgGapFailed = gapInfo.avgGap > 0 && gapInfo.lastGap < GAP_THRESHOLD_PERCENT * gapInfo.avgGap;

                if (minGapFailed || avgGapFailed) {
                    shouldExclude = true;

                    // Prefer minGap explanation if both conditions failed
                    if (minGapFailed) {
                        explanation = `Chuỗi hiện tại: ${currentLen} ngày.Khoảng cách ngắn nhất từng xuất hiện cho chuỗi ${targetLen} ngày là ${gapInfo.minGap} ngày.Khoảng cách từ lần cuối đến ngày mai: ${gapInfo.lastGap} ngày < ${gapInfo.minGap} ngày, nên xác suất lên ${targetLen} ngày là THẤP.`;
                    } else {
                        const thresholdValue = Math.round(GAP_THRESHOLD_PERCENT * gapInfo.avgGap);
                        const thresholdPercent = Math.round(GAP_THRESHOLD_PERCENT * 100);
                        explanation = `Chuỗi hiện tại: ${currentLen} ngày. TB xuất hiện chuỗi ${targetLen} ngày là ${gapInfo.avgGap} ngày. Khoảng cách từ lần cuối đến ngày mai: ${gapInfo.lastGap} ngày < ${thresholdPercent}% TB (${thresholdValue}), nên xác suất lên ${targetLen} ngày là THẤP.`;
                    }
                }

                if (shouldExclude) {
                    addExcludedNumber(stat, key, explanation);
                }
            }
        }

        function getCategoryName(category, subcategory, originalKey = null) {
            // Check original key first (for keys like cacSoLuiDeuLienTiep)
            if (originalKey) {
                const directMapping = {
                    // Các số
                    'cacSoTienLienTiep': 'Các số - Tiến liên tiếp',
                    'cacSoTienDeuLienTiep': 'Các số - Tiến Đều',
                    'cacSoLuiLienTiep': 'Các số - Lùi liên tiếp',
                    'cacSoLuiDeuLienTiep': 'Các số - Lùi Đều',
                    'tienLuiSoLe': 'Các số - Tiến Lùi So Le (>= 4 ngày)',
                    'luiTienSoLe': 'Các số - Lùi Tiến So Le (>= 4 ngày)',
                    // 1 số
                    'motSoVeLienTiep': '1 số - Về liên tiếp',
                    'motSoVeSole': '1 số - Về so le',
                    'motSoVeSoleMoi': '1 số - Về so le Mới',
                    // Cặp số
                    'capSoVeSoLe': 'Cặp số - Về so le',
                    // Các đầu/đít
                    'cacDauTien': 'Các Đầu - Tiến liên tiếp',
                    'cacDauTienDeu': 'Các Đầu - Tiến Đều',
                    'cacDauLui': 'Các Đầu - Lùi liên tiếp',
                    'cacDauLuiDeu': 'Các Đầu - Lùi Đều',
                    'cacDitTien': 'Các Đít - Tiến liên tiếp',
                    'cacDitTienDeu': 'Các Đít - Tiến Đều',
                    'cacDitLui': 'Các Đít - Lùi liên tiếp',
                    'cacDitLuiDeu': 'Các Đít - Lùi Đều',
                    // 1 đầu/đít
                    'motDauVeLienTiep': '1 Đầu - Về liên tiếp',
                    'motDauVeSole': '1 Đầu - Về so le',
                    'motDauVeSoleMoi': '1 Đầu - Về so le Mới',
                    'motDitVeLienTiep': '1 Đít - Về liên tiếp',
                    'motDitVeSole': '1 Đít - Về so le',
                    'motDitVeSoleMoi': '1 Đít - Về so le Mới'
                };

                if (directMapping[originalKey]) {
                    return directMapping[originalKey];
                }
            }

            // Build full key for lookup
            const fullKey = subcategory ? `${category}:${subcategory}` : category;

            // Pattern-based mapping for category:subcategory format
            let catName = category;

            // Tổng TT
            if (category.startsWith('tong_tt_')) {
                const suffix = category.replace('tong_tt_', '');
                if (suffix === 'cac_tong') catName = 'Tổng TT - Các tổng';
                else if (suffix === 'chan') catName = 'Tổng TT - Chẵn';
                else if (suffix === 'le') catName = 'Tổng TT - Lẻ';
                else if (suffix.match(/^\d+$/)) catName = `Tổng TT - Tổng ${suffix}`;
                else if (suffix.includes('_')) {
                    const parts = suffix.split('_');
                    catName = `Tổng TT - Dạng tổng (${parts.join(',')})`;
                }
                else catName = `Tổng TT - ${suffix}`;
            }
            // Tổng Mới
            else if (category.startsWith('tong_moi_')) {
                const suffix = category.replace('tong_moi_', '');
                if (suffix === 'cac_tong') catName = 'Tổng Mới - Các tổng';
                else if (suffix === 'chan') catName = 'Tổng Mới - Chẵn';
                else if (suffix === 'le') catName = 'Tổng Mới - Lẻ';
                else if (suffix.match(/^\d+$/)) catName = `Tổng Mới - Tổng ${suffix}`;
                else catName = `Tổng Mới - ${suffix}`;
            }
            // Hiệu
            else if (category.startsWith('hieu_')) {
                const suffix = category.replace('hieu_', '');
                if (suffix === 'cac_hieu') catName = 'Hiệu - Các hiệu';
                else if (suffix === 'chan') catName = 'Hiệu - Chẵn';
                else if (suffix === 'le') catName = 'Hiệu - Lẻ';
                else if (suffix.match(/^\d+$/)) catName = `Hiệu - Hiệu ${suffix}`;
                else catName = `Hiệu - ${suffix}`;
            }
            // Đầu Đít Tiến
            else if (category.startsWith('dau_dit_tien_')) {
                const num = category.replace('dau_dit_tien_', '');
                catName = `Dạng Đồng Tiến ${num} (0${num},${parseInt(num) + 1}${num}...)`;
            }
            // Composite patterns - PHẢI CHECK TRƯỚC dau_/dit_ vì chúng cũng start with dau_/dit_
            else if (category === 'chanChan') catName = 'Dạng Chẵn-Chẵn';
            else if (category === 'chanLe') catName = 'Dạng Chẵn-Lẻ';
            else if (category === 'leChan') catName = 'Dạng Lẻ-Chẵn';
            else if (category === 'leLe') catName = 'Dạng Lẻ-Lẻ';
            else if (category === 'dau_nho_dit_nho') catName = 'Đầu nhỏ-Đít nhỏ';
            else if (category === 'dau_nho_dit_to') catName = 'Đầu nhỏ-Đít to';
            else if (category === 'dau_to_dit_nho') catName = 'Đầu to-Đít nhỏ';
            else if (category === 'dau_to_dit_to') catName = 'Đầu to-Đít to';
            else if (category === 'dau_chan_dit_chan') catName = 'Đầu chẵn-Đít chẵn';
            else if (category === 'dau_chan_dit_le') catName = 'Đầu chẵn-Đít lẻ';
            else if (category === 'dau_le_dit_chan') catName = 'Đầu lẻ-Đít chẵn';
            else if (category === 'dau_le_dit_le') catName = 'Đầu lẻ-Đít lẻ';
            // Đầu (PHẢI SAU composite patterns)
            else if (category.startsWith('dau_')) {
                const suffix = category.replace('dau_', '');
                if (suffix.match(/^\d$/)) catName = `Đầu ${suffix}`;
                else if (suffix === 'chan') catName = 'Đầu Chẵn';
                else if (suffix === 'le') catName = 'Đầu Lẻ';
                else if (suffix === 'nho') catName = 'Đầu Nhỏ';
                else if (suffix === 'to') catName = 'Đầu To';
                else catName = `Đầu - ${suffix}`;
            }
            // Đít (PHẢI SAU composite patterns)
            else if (category.startsWith('dit_')) {
                const suffix = category.replace('dit_', '');
                if (suffix.match(/^\d$/)) catName = `Đít ${suffix}`;
                else if (suffix === 'chan') catName = 'Đít Chẵn';
                else if (suffix === 'le') catName = 'Đít Lẻ';
                else if (suffix === 'nho') catName = 'Đít Nhỏ';
                else if (suffix === 'to') catName = 'Đít To';
                else catName = `Đít - ${suffix}`;
            }

            // Add subcategory suffix if present
            if (subcategory) {
                if (subcategory === 'veLienTiep') return `${catName} - Về liên tiếp`;
                if (subcategory === 'veSole') return `${catName} - Về so le`;
                if (subcategory === 'veSoleMoi') return `${catName} - Về so le mới`;
                if (subcategory === 'veCungGiaTri') return `${catName} - Về cùng giá trị`;
                if (subcategory === 'tienDeuLienTiep') return `${catName} - Tiến Đều`;
                if (subcategory === 'luiDeuLienTiep') return `${catName} - Lùi Đều`;
                if (subcategory === 'tienLienTiep') return `${catName} - Tiến liên tiếp`;
                if (subcategory === 'luiLienTiep') return `${catName} - Lùi liên tiếp`;
                if (subcategory === 'dongTien') return `${catName} - Đồng tiến`;
                if (subcategory === 'dongLui') return `${catName} - Đồng lùi`;
                return `${catName} - ${subcategory}`;
            }

            return catName;
        }

        function addExcludedNumber(stat, key, reason) {
            let nums = [];

            // Parse key - handle both formats:
            // Format 1: "category:subcategory" (e.g., "tong_tt_cac_tong:luiDeuLienTiep")
            // Format 2: "categorySubcategory" (e.g., "cacSoLuiDeuLienTiep", "cacDauLuiDeu")
            let category, subcategory;

            if (key.includes(':')) {
                [category, subcategory] = key.split(':');
            } else {
                // Extract subcategory from end of key
                const patterns = [
                    'LuiDeuLienTiep', 'TienDeuLienTiep',
                    'LuiLienTiep', 'TienLienTiep',
                    'LuiDeu', 'TienDeu',
                    'VeLienTiep', 'VeCungGiaTri', 'VeSole', 'VeSoleMoi',
                    'DongTien', 'DongLui'
                ];

                for (const pattern of patterns) {
                    if (key.endsWith(pattern)) {
                        subcategory = pattern.charAt(0).toLowerCase() + pattern.slice(1); // Convert to camelCase
                        category = key.slice(0, -pattern.length);
                        break;
                    }
                }

                if (!subcategory) {
                    console.warn(`[Suggestions] Unable to parse key: ${key}`);
                    category = key;
                    subcategory = '';
                }
            }

            // Xử lý các dạng Tiến/Lùi (Đều hoặc Liên Tiếp) - dự đoán giá trị tiếp theo
            if (subcategory === 'tienDeuLienTiep' || subcategory === 'luiDeuLienTiep' ||
                subcategory === 'tienLienTiep' || subcategory === 'luiLienTiep') {
                nums = predictNextInSequence(stat, category, subcategory);
            }
            // Xử lý các dạng về liên tiếp - cùng số
            else if (subcategory === 'veLienTiep' || subcategory === 'veCungGiaTri') {
                // Kiểm tra xem đây là dạng gì
                if (category.startsWith('dau_')) {
                    // Đầu X về liên tiếp → tất cả số có đầu = X
                    const digit = category.split('_')[1];
                    nums = Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => String(n).padStart(2, '0')[0] === digit);
                } else if (category.startsWith('dit_')) {
                    // Đít X về liên tiếp → tất cả số có đít = X
                    const digit = category.split('_')[1];
                    nums = Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => String(n).padStart(2, '0')[1] === digit);
                } else if (category.startsWith('tong_tt_') || category.startsWith('tong_moi_') || category.startsWith('hieu_')) {
                    // Tổng/Hiệu về liên tiếp → tất cả số trong dạng đó
                    // Ví dụ: tong_tt_6_7_8 → tất cả số có tổng 6, 7, hoặc 8
                    nums = getNumbersFromCategory(category);
                } else if (stat.current.value) {
                    // Số cụ thể về liên tiếp
                    nums = [parseInt(stat.current.value, 10)];
                } else if (stat.current.values && stat.current.values.length > 0) {
                    // Trường hợp có values array
                    nums = stat.current.values.map(v => parseInt(v, 10));
                } else {
                    // Fallback: lấy toàn bộ set
                    nums = getNumbersFromCategory(category);
                }
            }
            // Xử lý các dạng về so le (alternating)
            else if (subcategory === 'veSole' || subcategory === 'veSoleMoi') {
                // Với so le, gợi ý loại trừ số/giá trị đang lặp lại
                let valuesToExclude = [];
                if (stat.current.value) {
                    valuesToExclude = [stat.current.value];
                } else if (stat.current.values && stat.current.values.length > 0) {
                    valuesToExclude = stat.current.values;
                }

                // Nếu category là dạng thuộc tính (Tổng, Đầu, Đít...), cần expand giá trị thành bộ số
                if (category.startsWith('tong_') || category.startsWith('hieu_') ||
                    category.startsWith('dau_') || category.startsWith('dit_')) {

                    nums = [];
                    for (const val of valuesToExclude) {
                        // Construct a temporary category key for this specific value
                        // e.g. if category is 'tong_tt_cac_tong' and val is '5', we want numbers for 'tong_tt_5'
                        let tempCategory = '';

                        if (category.startsWith('tong_tt_')) tempCategory = `tong_tt_${val} `;
                        else if (category.startsWith('tong_moi_')) tempCategory = `tong_moi_${val} `;
                        else if (category.startsWith('hieu_')) tempCategory = `hieu_${val} `;
                        else if (category.startsWith('dau_')) tempCategory = `dau_${val} `;
                        else if (category.startsWith('dit_')) tempCategory = `dit_${val} `;

                        // Use the existing helper to get numbers for this specific property value
                        const expandedNums = getNumbersFromCategory(tempCategory);
                        nums = [...nums, ...expandedNums];
                    }
                    // Deduplicate
                    nums = [...new Set(nums)];
                } else {
                    // Nếu là số cụ thể (không phải thuộc tính), dùng trực tiếp
                    nums = valuesToExclude.map(v => parseInt(v, 10));
                }
            }
            // Xử lý các dạng khác - toàn bộ set
            else {
                nums = getNumbersFromCategory(category);
            }

            // Fallback: nếu nums rỗng, thử lấy từ category
            if (nums.length === 0) {
                nums = getNumbersFromCategory(category);
            }

            // Filter out null, undefined, and NaN values
            if (nums.length > 0) {
                nums = nums.filter(n => n !== null && n !== undefined && !isNaN(n) && typeof n === 'number');
            }

            // Luôn thêm explanation nếu có lý do, kể cả khi không có số cụ thể (để cảnh báo)
            if (nums.length > 0) {
                // Chỉ thêm vào danh sách loại trừ nếu có số cụ thể
                nums.forEach(n => excludedNumbers.add(n));
                explanations.push({
                    type: 'exclude',
                    title: getCategoryName(category, subcategory, key),
                    explanation: reason,
                    numbers: nums
                });
            } else {
                // Nếu không dự đoán được số nào, log warning và KHÔNG thêm vào danh sách
                console.warn(`[Suggestions] Warning: Excluded triggered for ${key} but no numbers predicted. Skipping.`);
            }
        }

        function predictNextInSequence(stat, category, subcategory) {
            // Lấy lastValue từ values hoặc value
            let lastValue = null;
            if (stat.current.values && stat.current.values.length > 0) {
                lastValue = stat.current.values[stat.current.values.length - 1];
            } else if (stat.current.value) {
                lastValue = stat.current.value;
            } else {
                return [];
            }

            const isProgressive = subcategory.includes('tien'); // tienDeuLienTiep or tienLienTiep
            const isUniform = subcategory.includes('Deu'); // Đều = uniform sequence

            // Xác định loại sequence và dự đoán giá trị tiếp theo
            let nextValue = null;
            let numberSet = null;
            let indexMap = null;

            // Check for Dong Tien / Dong Lui
            const isDongTien = subcategory === 'dongTien';
            const isDongLui = subcategory === 'dongLui';

            // === XÁC ĐỊNH SEQUENCE DỰA TRÊN CATEGORY ===

            // Helper: Parse sequence từ category
            const getSequence = (cat) => {
                // 1. Các dạng Tổng
                if (cat.startsWith('tong_tt_')) {
                    const suffix = cat.replace('tong_tt_', '');
                    if (suffix === 'cac_tong') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
                    if (suffix.includes('_')) {
                        // Dạng group: 5_7, 9_1, 10_2, chan_chan, etc.
                        if (suffix === 'chan') return ['2', '4', '6', '8', '10'];
                        if (suffix === 'le') return ['1', '3', '5', '7', '9'];
                        if (suffix === 'chan_chan') return ['2', '4', '6', '8', '10']; // Tạm thời map về chẵn
                        if (suffix === 'chan_le') return ['1', '3', '5', '7', '9']; // Tạm thời map về lẻ
                        // Parse range/group: 5_7 -> [5,6,7], 9_1 -> [9,10,1]
                        const parts = suffix.split('_').map(n => parseInt(n));
                        if (parts.length >= 2) {
                            // Tạo sequence từ start đến end (có wrap)
                            // Tuy nhiên, logic đơn giản nhất là lấy từ tên group nếu nó là consecutive
                            // Hoặc định nghĩa cứng các group phổ biến
                            // Với 5_7 -> 5,6,7. Với 9_1 -> 9,10,1.
                            // Cách tốt nhất: Dùng danh sách đầy đủ và filter
                            const fullSeq = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                            const start = parts[0];
                            const end = parts[parts.length - 1];

                            if (start < end) {
                                return fullSeq.filter(n => n >= start && n <= end).map(String);
                            } else {
                                // Wrap: 9, 10, 1
                                return [...fullSeq.filter(n => n >= start), ...fullSeq.filter(n => n <= end)].map(String);
                            }
                        }
                    }
                    // Dạng đơn: tong_tt_1 -> ['1'] (Không có sequence để tiến/lùi trừ khi xét số)
                    return [suffix];
                }

                if (cat.startsWith('tong_moi_')) {
                    const suffix = cat.replace('tong_moi_', '');
                    if (suffix === 'cac_tong') return Array.from({ length: 19 }, (_, i) => String(i));
                    if (suffix.includes('_')) {
                        if (suffix === 'chan') return Array.from({ length: 10 }, (_, i) => String(i * 2));
                        if (suffix === 'le') return Array.from({ length: 9 }, (_, i) => String(i * 2 + 1));

                        const parts = suffix.split('_').map(n => parseInt(n));
                        if (parts.length >= 2) {
                            const fullSeq = Array.from({ length: 19 }, (_, i) => i);
                            const start = parts[0];
                            const end = parts[parts.length - 1];
                            if (start < end) {
                                return fullSeq.filter(n => n >= start && n <= end).map(String);
                            } else {
                                return [...fullSeq.filter(n => n >= start), ...fullSeq.filter(n => n <= end)].map(String);
                            }
                        }
                    }
                    return [suffix];
                }

                // 2. Các dạng Hiệu
                if (cat.startsWith('hieu_')) {
                    const suffix = cat.replace('hieu_', '');
                    if (suffix === 'cac_hieu') return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                    if (suffix.includes('_')) {
                        if (suffix === 'chan') return ['0', '2', '4', '6', '8'];
                        if (suffix === 'le') return ['1', '3', '5', '7', '9'];

                        const parts = suffix.split('_').map(n => parseInt(n));
                        if (parts.length >= 2) {
                            const fullSeq = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
                            const start = parts[0];
                            const end = parts[parts.length - 1];
                            if (start < end) {
                                return fullSeq.filter(n => n >= start && n <= end).map(String);
                            } else {
                                return [...fullSeq.filter(n => n >= start), ...fullSeq.filter(n => n <= end)].map(String);
                            }
                        }
                    }
                    return [suffix];
                }

                // 3. Các dạng Đầu/Đít Group
                if (cat === 'dau_nho' || cat === 'dit_nho') return ['0', '1', '2', '3', '4'];
                if (cat === 'dau_to' || cat === 'dit_to') return ['5', '6', '7', '8', '9'];
                if (cat === 'dau_chan' || cat === 'dit_chan') return ['0', '2', '4', '6', '8'];
                if (cat === 'dau_le' || cat === 'dit_le') return ['1', '3', '5', '7', '9'];

                // Các dạng Đầu/Đít cụ thể (dau_le_lon_hon_5, etc.)
                if (cat.includes('lon_hon_') || cat.includes('nho_hon_')) {
                    // Logic này đã có trong code cũ, nhưng ta có thể tổng quát hóa
                    if (cat.includes('dau_le_lon_hon_5')) return ['7', '9']; // > 5 và lẻ: 7, 9
                    if (cat.includes('dau_le_nho_hon_5')) return ['1', '3']; // < 5 và lẻ: 1, 3
                    if (cat.includes('dau_chan_lon_hon_4')) return ['6', '8']; // > 4 và chẵn: 6, 8
                    if (cat.includes('dau_chan_nho_hon_4')) return ['0', '2']; // < 4 và chẵn: 0, 2
                    // Tương tự cho đít...
                    if (cat.includes('dit_le_lon_hon_5')) return ['7', '9'];
                    if (cat.includes('dit_le_nho_hon_5')) return ['1', '3'];
                    if (cat.includes('dit_chan_lon_hon_4')) return ['6', '8'];
                    if (cat.includes('dit_chan_nho_hon_4')) return ['0', '2'];
                }

                // 4. Composite patterns - these track 2-digit numbers, not individual digits
                // Basic composite patterns
                if (cat === 'chanChan') return SETS['CHAN_CHAN'] || [];
                if (cat === 'chanLe') return SETS['CHAN_LE'] || [];
                if (cat === 'leChan') return SETS['LE_CHAN'] || [];
                if (cat === 'leLe') return SETS['LE_LE'] || [];

                // Size-based composite patterns
                if (cat === 'dau_nho_dit_nho') return SETS['DAU_NHO_DIT_NHO'] || [];
                if (cat === 'dau_nho_dit_to') return SETS['DAU_NHO_DIT_TO'] || [];
                if (cat === 'dau_to_dit_nho') return SETS['DAU_TO_DIT_NHO'] || [];
                if (cat === 'dau_to_dit_to') return SETS['DAU_TO_DIT_TO'] || [];

                // Complex conditional composite patterns
                if (cat === 'dau_chan_lon_4_dit_chan_lon_4') return SETS['DAU_CHAN_LON_4_DIT_CHAN_LON_4'] || [];
                if (cat === 'dau_chan_lon_4_dit_chan_nho_4') return SETS['DAU_CHAN_LON_4_DIT_CHAN_NHO_4'] || [];
                if (cat === 'dau_chan_nho_4_dit_chan_lon_4') return SETS['DAU_CHAN_NHO_4_DIT_CHAN_LON_4'] || [];
                if (cat === 'dau_chan_nho_4_dit_chan_nho_4') return SETS['DAU_CHAN_NHO_4_DIT_CHAN_NHO_4'] || [];
                if (cat === 'dau_chan_lon_4_dit_le_lon_5') return SETS['DAU_CHAN_LON_4_DIT_LE_LON_5'] || [];
                if (cat === 'dau_chan_lon_4_dit_le_nho_5') return SETS['DAU_CHAN_LON_4_DIT_LE_NHO_5'] || [];
                if (cat === 'dau_chan_nho_4_dit_le_lon_5') return SETS['DAU_CHAN_NHO_4_DIT_LE_LON_5'] || [];
                if (cat === 'dau_chan_nho_4_dit_le_nho_5') return SETS['DAU_CHAN_NHO_4_DIT_LE_NHO_5'] || [];
                if (cat === 'dau_le_lon_5_dit_chan_lon_4') return SETS['DAU_LE_LON_5_DIT_CHAN_LON_4'] || [];
                if (cat === 'dau_le_lon_5_dit_chan_nho_4') return SETS['DAU_LE_LON_5_DIT_CHAN_NHO_4'] || [];
                if (cat === 'dau_le_nho_5_dit_chan_lon_4') return SETS['DAU_LE_NHO_5_DIT_CHAN_LON_4'] || [];
                if (cat === 'dau_le_nho_5_dit_chan_nho_4') return SETS['DAU_LE_NHO_5_DIT_CHAN_NHO_4'] || [];
                if (cat === 'dau_le_lon_5_dit_le_lon_5') return SETS['DAU_LE_LON_5_DIT_LE_LON_5'] || [];
                if (cat === 'dau_le_lon_5_dit_le_nho_5') return SETS['DAU_LE_LON_5_DIT_LE_NHO_5'] || [];
                if (cat === 'dau_le_nho_5_dit_le_lon_5') return SETS['DAU_LE_NHO_5_DIT_LE_LON_5'] || [];
                if (cat === 'dau_le_nho_5_dit_le_nho_5') return SETS['DAU_LE_NHO_5_DIT_LE_NHO_5'] || [];

                // Specific digit composite patterns
                if (cat === 'dau_4_dit_chan_lon_4') return SETS['DAU_4_DIT_CHAN_LON_4'] || [];
                if (cat === 'dau_4_dit_chan_nho_4') return SETS['DAU_4_DIT_CHAN_NHO_4'] || [];
                if (cat === 'dau_4_dit_le_lon_5') return SETS['DAU_4_DIT_LE_LON_5'] || [];
                if (cat === 'dau_4_dit_le_nho_5') return SETS['DAU_4_DIT_LE_NHO_5'] || [];
                if (cat === 'dau_5_dit_chan_lon_4') return SETS['DAU_5_DIT_CHAN_LON_4'] || [];
                if (cat === 'dau_5_dit_chan_nho_4') return SETS['DAU_5_DIT_CHAN_NHO_4'] || [];
                if (cat === 'dau_5_dit_le_lon_5') return SETS['DAU_5_DIT_LE_LON_5'] || [];
                if (cat === 'dau_5_dit_le_nho_5') return SETS['DAU_5_DIT_LE_NHO_5'] || [];
                if (cat === 'dit_4_dau_chan_lon_4') return SETS['DIT_4_DAU_CHAN_LON_4'] || [];
                if (cat === 'dit_4_dau_chan_nho_4') return SETS['DIT_4_DAU_CHAN_NHO_4'] || [];
                if (cat === 'dit_4_dau_le_lon_5') return SETS['DIT_4_DAU_LE_LON_5'] || [];
                if (cat === 'dit_4_dau_le_nho_5') return SETS['DIT_4_DAU_LE_NHO_5'] || [];
                if (cat === 'dit_5_dau_chan_lon_4') return SETS['DIT_5_DAU_CHAN_LON_4'] || [];
                if (cat === 'dit_5_dau_chan_nho_4') return SETS['DIT_5_DAU_CHAN_NHO_4'] || [];
                if (cat === 'dit_5_dau_le_lon_5') return SETS['DIT_5_DAU_LE_LON_5'] || [];
                if (cat === 'dit_5_dau_le_nho_5') return SETS['DIT_5_DAU_LE_NHO_5'] || [];

                // 5. Đồng Tiến
                if (cat.startsWith('dau_dit_tien_')) {
                    const setKey = 'DAU_DIT_TIEN_' + cat.split('_')[3];
                    return SETS[setKey] || [];
                }

                // 6. Special cases: cacSo, cacDau, cacDit
                if (cat === 'cacSo') {
                    // All numbers 00-99
                    return Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));
                }
                if (cat === 'cacDau') {
                    // All head digits 0-9
                    return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                }
                if (cat === 'cacDit') {
                    // All tail digits 0-9
                    return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                }

                // 7. Đầu/Đít đơn (cho Dong Tien/Dong Lui)
                if (cat.startsWith('dau_') && !cat.includes('_')) return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                if (cat.startsWith('dit_') && !cat.includes('_')) return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                return null;
            };

            // Helper: Extract value based on category type
            const extractValue = (val, cat) => {
                const strVal = String(val).padStart(2, '0');

                // ALL composite patterns use full 2-digit number
                // Check if category is a composite pattern (contains multiple conditions)
                const compositePatterns = [
                    'chanChan', 'chanLe', 'leChan', 'leLe',
                    'dau_nho_dit_nho', 'dau_nho_dit_to', 'dau_to_dit_nho', 'dau_to_dit_to',
                    'dau_chan_lon_4_dit_chan_lon_4', 'dau_chan_lon_4_dit_chan_nho_4',
                    'dau_chan_nho_4_dit_chan_lon_4', 'dau_chan_nho_4_dit_chan_nho_4',
                    'dau_chan_lon_4_dit_le_lon_5', 'dau_chan_lon_4_dit_le_nho_5',
                    'dau_chan_nho_4_dit_le_lon_5', 'dau_chan_nho_4_dit_le_nho_5',
                    'dau_le_lon_5_dit_chan_lon_4', 'dau_le_lon_5_dit_chan_nho_4',
                    'dau_le_nho_5_dit_chan_lon_4', 'dau_le_nho_5_dit_chan_nho_4',
                    'dau_le_lon_5_dit_le_lon_5', 'dau_le_lon_5_dit_le_nho_5',
                    'dau_le_nho_5_dit_le_lon_5', 'dau_le_nho_5_dit_le_nho_5',
                    'dau_4_dit_chan_lon_4', 'dau_4_dit_chan_nho_4', 'dau_4_dit_le_lon_5', 'dau_4_dit_le_nho_5',
                    'dau_5_dit_chan_lon_4', 'dau_5_dit_chan_nho_4', 'dau_5_dit_le_lon_5', 'dau_5_dit_le_nho_5',
                    'dit_4_dau_chan_lon_4', 'dit_4_dau_chan_nho_4', 'dit_4_dau_le_lon_5', 'dit_4_dau_le_nho_5',
                    'dit_5_dau_chan_lon_4', 'dit_5_dau_chan_nho_4', 'dit_5_dau_le_lon_5', 'dit_5_dau_le_nho_5'
                ];

                if (compositePatterns.includes(cat)) return strVal;
                if (cat.startsWith('dau_dit_tien_')) return strVal; // Đồng tiến dùng cả số

                // Special cases
                if (cat === 'cacSo') return strVal; // Full 2-digit number
                if (cat === 'cacDau') return strVal[0]; // Head digit
                if (cat === 'cacDit') return strVal[1]; // Tail digit

                if (cat.startsWith('tong_tt_')) return String(getTongTT(strVal));
                if (cat.startsWith('tong_moi_')) return String(getTongMoi(strVal));
                if (cat.startsWith('hieu_')) return String(getHieu(strVal));
                if (cat.startsWith('dau_')) return strVal[0];
                if (cat.startsWith('dit_')) return strVal[1];
                return strVal;
            };

            const lastValueToPredict = extractValue(lastValue, category);

            let nextValues = []; // Changed from single nextValue to array

            numberSet = getSequence(category);

            if (numberSet) {
                indexMap = new Map(numberSet.map((v, i) => [v, i]));

                // Xử lý logic dự đoán
                if (isUniform) {
                    // Đều: Tìm next trong set (giữ nguyên logic cũ, chỉ trả về 1 giá trị)
                    const val = isProgressive
                        ? findNextInSet(lastValueToPredict, numberSet, indexMap)
                        : findPreviousInSet(lastValueToPredict, numberSet, indexMap);
                    if (val !== null) nextValues.push(val);
                } else if (isDongTien || isDongLui) {
                    // Đồng Tiến / Đồng Lùi:
                    // Đồng Tiến: Lấy tất cả số LỚN HƠN lastValue trong set (KHÔNG WRAP)
                    // Đồng Lùi: Lấy tất cả số NHỎ HƠN lastValue trong set (KHÔNG WRAP)
                    nextValues = getAllGreaterOrSmaller(lastValueToPredict, numberSet, isDongTien, false);
                } else {
                    // Liên Tiếp:
                    // TẤT CẢ các dạng đều xoay vòng (wrap=true)
                    // Logic trong getAllGreaterOrSmaller đã đúng:
                    // - Normal: Trả về TẤT CẢ giá trị lớn hơn/nhỏ hơn
                    // - Wrap (đạt min/max): Trả về DUY NHẤT 1 giá trị (boundary đối diện)
                    nextValues = getAllGreaterOrSmaller(lastValueToPredict, numberSet, isProgressive, true);
                }
            } else {
                // Fallback cho các dạng chưa support sequence (trả về full set)
                return getNumbersFromCategory(category);
            }

            // === TRẢ VỀ KẾT QUẢ ===

            const resultNumbers = [];

            // Định nghĩa composite patterns để check
            const compositePatterns = [
                'chanChan', 'chanLe', 'leChan', 'leLe',
                'dau_nho_dit_nho', 'dau_nho_dit_to', 'dau_to_dit_nho', 'dau_to_dit_to',
                'dau_chan_lon_4_dit_chan_lon_4', 'dau_chan_lon_4_dit_chan_nho_4',
                'dau_chan_nho_4_dit_chan_lon_4', 'dau_chan_nho_4_dit_chan_nho_4',
                'dau_chan_lon_4_dit_le_lon_5', 'dau_chan_lon_4_dit_le_nho_5',
                'dau_chan_nho_4_dit_le_lon_5', 'dau_chan_nho_4_dit_le_nho_5',
                'dau_le_lon_5_dit_chan_lon_4', 'dau_le_lon_5_dit_chan_nho_4',
                'dau_le_nho_5_dit_chan_lon_4', 'dau_le_nho_5_dit_chan_nho_4',
                'dau_le_lon_5_dit_le_lon_5', 'dau_le_lon_5_dit_le_nho_5',
                'dau_le_nho_5_dit_le_lon_5', 'dau_le_nho_5_dit_le_nho_5',
                'dau_4_dit_chan_lon_4', 'dau_4_dit_chan_nho_4', 'dau_4_dit_le_lon_5', 'dau_4_dit_le_nho_5',
                'dau_5_dit_chan_lon_4', 'dau_5_dit_chan_nho_4', 'dau_5_dit_le_lon_5', 'dau_5_dit_le_nho_5',
                'dit_4_dau_chan_lon_4', 'dit_4_dau_chan_nho_4', 'dit_4_dau_le_lon_5', 'dit_4_dau_le_nho_5',
                'dit_5_dau_chan_lon_4', 'dit_5_dau_chan_nho_4', 'dit_5_dau_le_lon_5', 'dit_5_dau_le_nho_5'
            ];

            // Duyệt qua tất cả các giá trị dự đoán được
            for (const nextVal of nextValues) {
                // Với Tổng TT
                if (category.startsWith('tong_tt_')) {
                    const targetSum = parseInt(nextVal, 10);
                    resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => getTongTT(String(n).padStart(2, '0')) === targetSum));
                }
                // Với Tổng Mới
                else if (category.startsWith('tong_moi_')) {
                    const targetSum = parseInt(nextVal, 10);
                    resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => getTongMoi(String(n).padStart(2, '0')) === targetSum));
                }
                // Với Hiệu
                else if (category.startsWith('hieu_')) {
                    const targetDiff = parseInt(nextVal, 10);
                    resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => getHieu(String(n).padStart(2, '0')) === targetDiff));
                }
                // Với Đồng Tiến
                else if (category.startsWith('dau_dit_tien_')) {
                    resultNumbers.push(parseInt(nextVal, 10));
                }
                // Special cases: cacSo, cacDau, cacDit
                else if (category === 'cacSo') {
                    // nextVal is already a 2-digit number string
                    resultNumbers.push(parseInt(nextVal, 10));
                }
                else if (category === 'cacDau') {
                    // nextVal is a digit, get all numbers with that head
                    const targetDigit = nextVal;
                    resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => String(n).padStart(2, '0')[0] === targetDigit));
                }
                else if (category === 'cacDit') {
                    // nextVal is a digit, get all numbers with that tail
                    const targetDigit = nextVal;
                    resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => String(n).padStart(2, '0')[1] === targetDigit));
                }
                // Với Composite patterns - CHECK TRƯỚC dau_/dit_ để tránh match nhầm
                else if (compositePatterns.includes(category)) {
                    resultNumbers.push(parseInt(nextVal, 10));
                }
                // Với Đầu/Đít đơn lẻ (PHẢI sau composite patterns)
                else if (category.startsWith('dau_')) {
                    const targetDigit = nextVal;
                    resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => String(n).padStart(2, '0')[0] === targetDigit));
                }
                else if (category.startsWith('dit_')) {
                    const targetDigit = nextVal;
                    resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                        .filter(n => String(n).padStart(2, '0')[1] === targetDigit));
                }
            }

            if (resultNumbers.length > 0) {
                return [...new Set(resultNumbers)]; // Remove duplicates if any
            }

            // Fallback cuối cùng
            return getNumbersFromCategory(category);
        }

        exports.predictNextInSequence = predictNextInSequence; // Export for exclusionService

        // Helper function: Tìm số tiếp theo trong set CÓ WRAP
        function findNextInSequenceWithWrap(currentValue, numberSet, isProgressive) {
            const sortedSet = [...numberSet].sort((a, b) => parseInt(a) - parseInt(b));
            const currentIndex = sortedSet.indexOf(currentValue);

            if (currentIndex === -1) return null;

            if (isProgressive) {
                if (currentIndex === sortedSet.length - 1) return sortedSet[0]; // Wrap to first
                return sortedSet[currentIndex + 1];
            } else {
                if (currentIndex === 0) return sortedSet[sortedSet.length - 1]; // Wrap to last
                return sortedSet[currentIndex - 1];
            }
        }

        // Helper function: Lấy TẤT CẢ các số lớn hơn/nhỏ hơn trong set (cho Liên Tiếp)
        // wrap: có cho phép wrap về đầu/cuối không (mặc định true)
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
                    // Forward wrap: Return Min value ONLY
                    result = [sortedSet[0]];
                } else {
                    // Normal forward: Return ALL greater values
                    result = greater;
                }
            } else {
                // Lùi: Lấy tất cả số nhỏ hơn
                const smaller = sortedSet.slice(0, currentIndex);
                // Nếu đã ở đầu, wrap về cuối (nếu cho phép)
                if (smaller.length === 0 && wrap) {
                    // Backward wrap: Return Max value ONLY
                    result = [sortedSet[sortedSet.length - 1]];
                } else {
                    // Normal backward: Return ALL smaller values
                    result = smaller;
                }
            }

            // Safety check: Đảm bảo không bao gồm giá trị hiện tại
            return result.filter(v => v !== currentValue);
        }



        // [MỚI] Tạo danh sách số đánh (Tất cả - Loại trừ)
        const allNumbers = Array.from({ length: 100 }, (_, k) => k);
        let numbersBet = allNumbers.filter(n => !excludedNumbers.has(n));
        let isSkipped = false;

        // Kiểm tra điều kiện chơi
        if (excludedNumbers.size <= 30) {
            isSkipped = true;
            numbersBet = []; // Không đánh
            explanations.push({
                type: 'exclude',
                title: 'Thông báo',
                explanation: `Số lượng loại trừ (${excludedNumbers.size}) <= 30. BỎ QUA.`,
                numbers: []
            });
        }

        res.json({
            excludedNumbers: Array.from(excludedNumbers).sort((a, b) => a - b),
            explanations: explanations,
            numbersToBet: numbersBet,
            isSkipped: isSkipped,
            excludedCount: excludedNumbers.size
        });

    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
};

function getNumbersFromCategory(category) {
    let setKey = category.toUpperCase();

    // Handle specific mappings
    if (category.startsWith('dau_')) {
        setKey = 'DAU_' + category.split('_')[1].toUpperCase();
    } else if (category.startsWith('dit_')) {
        setKey = 'DIT_' + category.split('_')[1].toUpperCase();
    } else if (category.startsWith('tong_tt_')) {
        setKey = 'TONG_TT_' + category.replace('tong_tt_', '').toUpperCase();
    } else if (category.startsWith('tong_moi_')) {
        setKey = 'TONG_MOI_' + category.replace('tong_moi_', '').toUpperCase();
    } else if (category.startsWith('hieu_')) {
        setKey = 'HIEU_' + category.replace('hieu_', '').toUpperCase();
    } else if (category.startsWith('dau_dit_tien_')) {
        setKey = 'DAU_DIT_TIEN_' + category.split('_')[3];
    } else if (category === 'chanChan') {
        setKey = 'CHAN_CHAN';
    } else if (category === 'chanLe') {
        setKey = 'CHAN_LE';
    } else if (category === 'leChan') {
        setKey = 'LE_CHAN';
    } else if (category === 'leLe') {
        setKey = 'LE_LE';
    }

    // 1. Try direct lookup
    if (SETS[setKey]) {
        return SETS[setKey].map(n => parseInt(n, 10));
    }

    // 2. Try dynamic group parsing (e.g., TONG_TT_5_6_7 or TONG_TT_5_7 as range)
    // Check for prefixes that support grouping
    const groupPrefixes = [
        { prefix: 'TONG_TT_', max: 10, min: 1 },
        { prefix: 'TONG_MOI_', max: 18, min: 0 },
        { prefix: 'HIEU_', max: 9, min: 0 }
    ];

    for (const config of groupPrefixes) {
        const { prefix, max, min } = config;
        if (setKey.startsWith(prefix)) {
            const suffix = setKey.replace(prefix, '');
            // Check if suffix contains underscores (indicating a group)
            if (suffix.includes('_')) {
                const parts = suffix.split('_').map(p => parseInt(p, 10));
                let targetNums = [];

                // Case A: Explicit list (e.g., 5_6_7) - handled by loop below if we treat it as list
                // Case B: Range (e.g., 5_7 -> 5, 6, 7) - common in this codebase

                // If exactly 2 parts, treat as range (START_END)
                if (parts.length === 2) {
                    const start = parts[0];
                    const end = parts[1];

                    // Generate sequence with wrap
                    let current = start;
                    while (current !== end) {
                        targetNums.push(current);
                        current++;
                        if (current > max) current = min;
                    }
                    targetNums.push(end);
                } else {
                    // Treat as explicit list
                    targetNums = parts;
                }

                // Fetch sets for each number
                let combinedNums = [];
                for (const num of targetNums) {
                    const individualKey = prefix + num;
                    if (SETS[individualKey]) {
                        combinedNums = [...combinedNums, ...SETS[individualKey]];
                    }
                }

                if (combinedNums.length > 0) {
                    // Deduplicate and return
                    return [...new Set(combinedNums)].map(n => parseInt(n, 10));
                }
            }
        }
    }

    return [];
}

exports.getNumbersFromCategory = getNumbersFromCategory;
