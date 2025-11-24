const getTongMoi = (n) => {
    const num = parseInt(n, 10);
    return Math.floor(num / 10) + (num % 10);
};
const getTongTT = (n) => {
    if (n === '00') return 10;
    const tongMoi = getTongMoi(n);
    const tongTT = tongMoi % 10;
    return tongTT === 0 ? 10 : tongTT;
};
const getHieu = (n) => {
    const num = parseInt(n, 10);
    return Math.abs(Math.floor(num / 10) - (num % 10));
};


document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('statsForm');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const minLengthSelect = document.getElementById('minLength');
    const statsTypeSelect = document.getElementById('statsType');
    const resultTitle = document.getElementById('result-title');
    const resultContainer = document.getElementById('result-table-container');
    const quickStatsContainer = document.getElementById('quick-stats-container');
    const currentStreaksSection = document.getElementById('current-streaks-section');
    const currentStreaksContainer = document.getElementById('current-streaks-container');
    const currentStreaksTitle = document.getElementById('current-streaks-title');
    const updateDataButton = document.getElementById('updateDataButton');
    const lastUpdateDateSpan = document.getElementById('lastUpdateDate');

    const parseDate = (dateString) => {
        if (!dateString) return null;
        const [day, month, year] = dateString.split('/');
        return new Date(year, month - 1, day);
    };

    const populateMinLength = (mode = 'default') => {
        // mode có thể là:
        // - 'default' (cho "mặc định", 2-20)
        // - 'sole' (cho "so le" cũ, 3,5,7...)
        // - 'tienLuiSoLe' (cho yêu cầu mới, 4-30)

        const currentValue = minLengthSelect.value;
        minLengthSelect.innerHTML = '';
        minLengthSelect.add(new Option('Tất cả', 'all'));

        if (mode === 'tienLuiSoLe') {
            // Yêu cầu mới: 4 đến 30
            for (let i = 4; i <= 30; i++) {
                minLengthSelect.add(new Option(i, i));
            }
        } else if (mode === 'sole') {
            // Logic "so le" cũ: 3, 5, 7... 19
            for (let i = 3; i <= 19; i += 2) {
                minLengthSelect.add(new Option(i, i));
            }
        } else {
            // Logic "mặc định" cũ: 2-20
            for (let i = 2; i <= 20; i++) {
                minLengthSelect.add(new Option(i, i));
            }
        }

        // Cố gắng giữ lại giá trị cũ nếu nó vẫn tồn tại trong danh sách mới
        if ([...minLengthSelect.options].some(opt => opt.value === currentValue)) {
            minLengthSelect.value = currentValue;
        }
    };

    const initializePage = () => {
        for (const groupName in STATS_OPTIONS) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;
            STATS_OPTIONS[groupName].forEach(option => {
                const opt = document.createElement('option');
                opt.textContent = option.text;
                opt.value = `${option.category}${option.subcategory ? ':' + option.subcategory : ''}`;
                optgroup.appendChild(opt);
            });
            statsTypeSelect.appendChild(optgroup);
        }
        // [SỬA LOGIC TẠI ĐÂY]
        // Thêm trình lắng nghe sự kiện VÀO BÊN TRONG initializePage
        statsTypeSelect.addEventListener('change', (event) => {
            const selectedValue = event.target.value;

            // 1. Ưu tiên kiểm tra 'tienLuiSoLe' / 'luiTienSoLe' TRƯỚC
            if (selectedValue === 'tienLuiSoLe' || selectedValue === 'luiTienSoLe') {
                populateMinLength('tienLuiSoLe'); // Chế độ mới (4-30)
            }
            // 2. Nếu không phải, thì mới kiểm tra "so le" chung
            else if (selectedValue.toLowerCase().includes('sole')) {
                populateMinLength('sole'); // Chế độ "so le" cũ (3, 5, 7...)
            }
            // 3. Còn lại là mặc định
            else {
                populateMinLength('default'); // Chế độ mặc định (2-20)
            }
        });

        // [MỚI] Tự động tải kết quả xổ số 7 ngày gần nhất
        fetchRecentResults();

        // Khởi tạo lần đầu với chế độ 'default'
        populateMinLength('default');

        const today = new Date();
        endDateInput.valueAsDate = today;
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 360);
        startDateInput.valueAsDate = pastDate;

        fetchQuickStats();
        fetchLastUpdateDate();
    };

    const fetchRecentResults = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/recent-results?limit=7`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            renderRecentResults(data);
        } catch (error) {
            console.error('Lỗi khi tải kết quả gần đây:', error);
            resultContainer.innerHTML = '<p class="text-red-500">Không thể tải kết quả xổ số gần đây.</p>';
        }
    };

    const renderRecentResults = (data) => {
        if (!data || data.length === 0) {
            resultContainer.innerHTML = '<p class="text-gray-500">Không có dữ liệu kết quả gần đây.</p>';
            return;
        }

        let html = `
            <h4 class="text-lg font-bold text-gray-800 mb-4">Kết quả xổ số 7 ngày gần nhất</h4>
            <div class="flex flex-wrap gap-4 justify-start">
        `;

        data.forEach(item => {
            // Format date dd/mm/yyyy
            const dateObj = new Date(item.date);
            const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

            // Use item.special instead of item.value
            const specialValue = item.special !== undefined ? item.special : '??';

            html += `
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col items-center min-w-[100px]">
                    <span class="text-2xl font-bold text-red-600 mb-2">${specialValue}</span>
                    <span class="text-xs text-gray-500">${dateStr}</span>
                </div>
            `;
        });

        html += `
            </div>
            <p class="mt-4 text-sm text-gray-500 italic">Chọn loại thống kê và nhấn "Thống Kê" để xem phân tích chi tiết.</p>
        `;

        resultContainer.innerHTML = html;
    };

    const fetchLastUpdateDate = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/latest-date`);
            const data = await response.json();
            if (data.latestDate) {
                lastUpdateDateSpan.textContent = data.latestDate;
            }
        } catch (error) {
            console.error('Lỗi khi lấy ngày cập nhật cuối:', error);
            lastUpdateDateSpan.textContent = 'Không xác định';
        }
    };

    const handleDataUpdate = async () => {
        const btn = updateDataButton;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang cập nhật...`;
        try {
            const response = await fetch(`${BASE_URL}/api/update-data`, { method: 'POST' });
            const result = await response.json();
            alert(result.message);
            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            alert('Cập nhật dữ liệu thất bại. Vui lòng thử lại sau.');
            console.error('Lỗi khi cập nhật dữ liệu:', error);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-arrow-clockwise mr-2"></i>Cập nhật dữ liệu`;
        }
    };

    updateDataButton.addEventListener('click', handleDataUpdate);

    const fetchQuickStats = async () => {
        try {
            const response = await fetch(`${BASE_URL}/statistics/api/v2/quick-stats`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            quickStatsContainer.innerHTML = '';
            const allCurrentStreaks = [];

            ORDERED_STATS_KEYS.forEach(key => {
                const stat = data[key];
                if (stat && !stat.error) {
                    if (stat.current) {
                        const recordLength = stat.longest && stat.longest.length > 0 ? stat.longest[0].length : 0;
                        allCurrentStreaks.push({ ...stat.current, key: key, description: stat.description, recordLength: recordLength, gapStats: stat.gapStats });
                    }
                    renderRecordAccordionItem(key, stat);
                }
            });
            const streaksByLength = allCurrentStreaks.reduce((acc, streak) => {
                if (!acc[streak.length]) { acc[streak.length] = []; }
                acc[streak.length].push(streak);
                return acc;
            }, {});
            renderCurrentStreaks(streaksByLength, allCurrentStreaks.length);
        } catch (error) {
            console.error("Lỗi khi tải thống kê nhanh:", error);
        }
    };

    const renderCurrentStreaks = (streaksByLength, totalCount) => {
        const sortedLengths = Object.keys(streaksByLength).sort((a, b) => b - a);
        if (totalCount > 0) {
            currentStreaksSection.classList.remove('d-none');
            currentStreaksTitle.innerHTML = `Chuỗi Đang Diễn Ra <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">${totalCount}</span>`;
            let finalHtml = '';
            sortedLengths.forEach(length => {
                finalHtml += `
                            <div class="mt-4">
                                <h4 class="text-sm font-semibold text-gray-600 uppercase tracking-wider flex justify-between items-center border-b pb-2 mb-4">
                                    <span><i class="bi bi-fire"></i> Chuỗi</span>
                                    <span class="font-bold text-lg text-red-500">${length} Ngày</span>
                                </h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">`;

                streaksByLength[length].forEach(streak => {
                    // Check if this streak has reached the record
                    const isRecord = parseInt(length) >= streak.recordLength && streak.recordLength > 0;
                    const borderColor = isRecord ? 'border-l-red-700' : 'border-l-red-500';
                    const bgColor = isRecord ? 'bg-red-50' : 'bg-white';
                    const titleWeight = isRecord ? 'font-bold' : 'font-semibold';

                    finalHtml += `
                                <div class="${bgColor} rounded-lg shadow-sm border border-l-4 ${borderColor} transition hover:shadow-lg hover:-translate-y-1">
                                    <div class="p-4 flex flex-col h-full">
                                        <h6 class="${titleWeight} text-gray-800">${streak.description}</h6>
                                        <p class="text-xs text-gray-500 mb-1">Từ ngày: ${streak.startDate}</p>
                                        <p class="text-xs text-gray-500">Kỷ lục: ${streak.recordLength} ngày</p>
                                        <div class="mt-auto pt-2">
                                           <div class="flex flex-wrap gap-1">${renderFullSequence(streak, streak.description)}</div>
                                        </div>
                                        ${(() => {
                            const isSoLePattern = streak.key && (streak.key.includes('veSole') || streak.key.includes('veSoleMoi'));
                            // For so le patterns, nextLen = currentLen + 2 (skip every other day)
                            // For other patterns, nextLen = currentLen + 1
                            const nextLen = isSoLePattern ? parseInt(length) + 2 : parseInt(length) + 1;
                            const currentLen = parseInt(length);

                            // Check if reached record
                            const hasReachedRecord = currentLen >= streak.recordLength && streak.recordLength > 0;

                            // Try to get gap stats for nextLen, fallback to currentLen
                            const gapData = (streak.gapStats && streak.gapStats[nextLen])
                                ? { stats: streak.gapStats[nextLen], len: nextLen }
                                : (streak.gapStats && streak.gapStats[currentLen])
                                    ? { stats: streak.gapStats[currentLen], len: currentLen }
                                    : null;

                            if (gapData) {
                                const g = gapData.stats;
                                const displayLen = gapData.len;

                                // Use config values
                                const GAP_THRESHOLD = AppConfig.get('GAP_THRESHOLD_PERCENT');
                                const USE_MIN_GAP = AppConfig.get('USE_MIN_GAP');
                                const SHOW_BACKGROUNDS = AppConfig.get('SHOW_PROBABILITY_BACKGROUNDS');
                                const HIGHLIGHT_GAP = AppConfig.get('HIGHLIGHT_LAST_GAP');

                                // Use minGap OR configurable % of avgGap for all patterns
                                const isLowProb = (USE_MIN_GAP && g.minGap !== null && g.lastGap < g.minGap) ||
                                    (g.avgGap > 0 && g.lastGap < GAP_THRESHOLD * g.avgGap);

                                // If reached record, show yellow badge; otherwise show normal badges
                                const probBadge = hasReachedRecord
                                    ? `<span class="inline-block bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold mt-1">🏆 Đạt kỷ lục</span>`
                                    : (isLowProb
                                        ? `<span class="inline-block bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded font-bold mt-1">Khó lên ${nextLen} ngày</span>`
                                        : `<span class="inline-block bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded font-bold mt-1">Dễ Tiếp Tục</span>`);

                                // Determine background color based on probability
                                const cardBg = SHOW_BACKGROUNDS
                                    ? (hasReachedRecord ? 'bg-yellow-50' : (isLowProb ? 'bg-red-50' : 'bg-white'))
                                    : 'bg-white';

                                // Highlight lastGap based on conditions
                                let lastGapClass = 'font-bold';
                                let lastGapText = g.lastGap;

                                // CRITICAL CASE: Always show strong warning if lastGap < minGap (regardless of HIGHLIGHT_GAP)
                                if (USE_MIN_GAP && g.minGap !== null && g.lastGap < g.minGap && isLowProb) {
                                    // Strong red warning with icon and border for critical low gap
                                    lastGapClass = 'font-bold text-red-700 bg-red-200 px-2 py-1 rounded border-2 border-red-400';
                                    lastGapText = `⚠️ ${g.lastGap}`;
                                } else if (HIGHLIGHT_GAP) {
                                    // Normal highlighting based on settings
                                    if (!isLowProb && !hasReachedRecord) {
                                        // Green highlight for "Dễ Tiếp Tục" case
                                        lastGapClass = 'font-bold text-green-600 bg-green-100 px-1 rounded';
                                    }
                                }

                                // Build gap info display
                                let gapInfoHtml = `
                                                    <div class="mt-2 pt-2 border-t border-gray-100 text-xs ${cardBg} -mx-4 -mb-4 p-4 rounded-b-lg">
                                                        <div class="flex justify-between"><span>TB giữa các chuỗi ${displayLen} ngày:</span> <strong>${g.avgGap}</strong></div>`;

                                if (g.minGap !== null) {
                                    gapInfoHtml += `<div class="flex justify-between"><span>Khoảng cách ngắn nhất:</span> <strong>${g.minGap}</strong></div>`;
                                }

                                gapInfoHtml += `<div class="flex justify-between"><span>Cách lần cuối:</span> <span class="${lastGapClass}">${lastGapText}</span></div>
                                                        <div class="text-center">${probBadge}</div>
                                                    </div>`;

                                return gapInfoHtml;
                            }
                            // Last resort fallback: if no gapStats at all, still show record badge if applicable
                            else if (hasReachedRecord) {
                                return `
                                    <div class="mt-2 pt-2 border-t border-gray-100 text-xs bg-yellow-50 -mx-4 -mb-4 p-4 rounded-b-lg">
                                        <div class="text-center">
                                            <span class="inline-block bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold mt-1">🏆 Đạt kỷ lục</span>
                                        </div>
                                    </div>`;
                            }
                            return '';
                        })()}
                                    </div>
                                </div>`;
                });
                finalHtml += `</div></div>`;
            });
            currentStreaksContainer.innerHTML = finalHtml;
        } else {
            currentStreaksSection.classList.add('d-none');
        }
    };

    const renderRecordAccordionItem = (key, stat) => {
        const safeKey = key.replace(/:/g, '-');
        const longestInfo = stat.longest && stat.longest.length > 0 ? `${stat.longest[0].length} ngày (${stat.longest.length})` : 'N/A';
        const secondLongestInfo = stat.secondLongest && stat.secondLongest.length > 0 ? `${stat.secondLongest[0].length} (${stat.secondLongest.length})` : 'N/A';
        const avgIntervalInfo = stat.averageInterval !== null ? `${stat.averageInterval} ngày` : 'N/A';
        const sinceLastInfo = stat.daysSinceLast !== null ? `${stat.daysSinceLast} ngày` : 'N/A';

        const gapStatsTable = (stat.gapStats) ? `
            <div class="mt-3 col-span-1 md:col-span-2">
                <h6 class="text-xs font-bold text-gray-700 mb-1">SỐ NGÀY XHTB GIỮA CÁC CHUỖI:</h6>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-xs text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" class="px-2 py-1">Độ dài</th>
                                <th scope="col" class="px-2 py-1">TB xuất hiện</th>
                                <th scope="col" class="px-2 py-1">Ngắn nhất</th>
                                <th scope="col" class="px-2 py-1">Lần cuối</th>
                                <th scope="col" class="px-2 py-1">Số lần</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(stat.gapStats)
                .filter(([len, data]) => data.count > 0)
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                .map(([len, data]) => `
                                <tr class="bg-white border-b">
                                    <td class="px-2 py-1 font-medium text-gray-900">Chuỗi ${len} ngày</td>
                                    <td class="px-2 py-1">${data.avgGap} ngày</td>
                                    <td class="px-2 py-1 font-semibold text-blue-600">${data.minGap !== null ? data.minGap + ' ngày' : 'N/A'}</td>
                                    <td class="px-2 py-1">${data.lastGap} ngày</td>
                                    <td class="px-2 py-1">${data.count}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : '';

        const itemHtml = `
                    <div x-data="{ open: false }">
                        <div @click="open = !open" class="record-accordion-button p-4 flex flex-wrap justify-between items-center cursor-pointer hover:bg-gray-50">
                             <span class="w-full lg:w-2/5 font-semibold text-gray-700 text-left">${stat.description}</span>
                             <div class="flex-grow grid grid-cols-4 gap-x-4 text-sm text-gray-500 text-left">
                                 <span><i class="bi bi-trophy"></i> KL: ${longestInfo}</span>
                                 <span><i class="bi bi-award"></i> Nhì: ${secondLongestInfo}</span>
                                 <span><i class="bi bi-arrow-repeat"></i> TB: ${avgIntervalInfo}</span>
                                 <span><i class="bi bi-hourglass-split"></i> Cuối: ${sinceLastInfo}</span>
                             </div>
                        </div>
                        <div x-show="open" x-transition class="bg-gray-50 p-4 accordion-content-highlight" :class="{ 'expanded': open }">
                           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${gapStatsTable}
                                <div>${renderStreakDetails('Kỷ lục', stat.longest, stat.description)}</div>
                                <div>${renderStreakDetails('Dài nhì', stat.secondLongest, stat.description)}</div>
                            </div>
                        </div>
                    </div>
                `;
        quickStatsContainer.insertAdjacentHTML('beforeend', itemHtml);
    };

    // SỬA LỖI: Hàm này nhận thêm 'description' để truyền xuống hàm con
    const renderStreakDetails = (title, streaks, description) => {
        if (!streaks || streaks.length === 0) return `<h6 class="font-semibold text-gray-600">${title}: Không có dữ liệu</h6>`;
        const sortedStreaks = streaks.sort((a, b) => parseDate(b.endDate) - parseDate(a.endDate));
        const streakLength = sortedStreaks[0].length;
        let detailsHtml = sortedStreaks.map(streak => `
                    <li class="mb-2">
                        <strong class="text-sm">${streak.startDate} → ${streak.endDate}</strong>
                        <div class="flex flex-wrap gap-1 mt-1">${renderFullSequence(streak, description)}</div>
                    </li>`).join('');
        return `<h6 class="font-semibold text-gray-600">${title} (Dài ${streakLength} ngày)</h6><ul class="list-none p-0 mt-2">${detailsHtml}</ul>`;
    };

    const handleStatsSubmit = async (event) => {
        event.preventDefault();
        resultTitle.textContent = `Kết Quả Truy Vấn (Đang tải...)`;
        resultContainer.innerHTML = '<div class="flex justify-center p-8"><div role="status" class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-indigo-600 motion-reduce:animate-[spin_1.5s_linear_infinite]"></div></div>';
        const selectedValue = statsTypeSelect.value;
        const [category, subcategory] = selectedValue.split(':');
        let url = `${BASE_URL}/statistics/api/v2/stats?category=${category}&exactLength=${minLengthSelect.value}`;
        if (subcategory) { url += `&subcategory=${subcategory}`; }
        if (startDateInput.value) url += `&startDate=${toApiDateFormat(startDateInput.value)}`;
        if (endDateInput.value) url += `&endDate=${toApiDateFormat(endDateInput.value)}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
            const data = await response.json();
            resultTitle.innerHTML = `${data.description || 'Kết Quả Truy Vấn'} <span class="inline-flex items-center justify-center px-2 py-1 text-sm font-bold leading-none text-blue-100 bg-blue-600 rounded-full">${data.streaks.length} kết quả</span>`;
            renderResults(data.streaks, data.description);
        } catch (error) {
            console.error('Lỗi khi fetch dữ liệu:', error);
            resultTitle.textContent = 'Có lỗi xảy ra khi tải dữ liệu.';
            resultContainer.innerHTML = '';
        }
    };

    // SỬA LỖI: Hàm này nhận thêm 'description' để truyền xuống hàm con
    const renderResults = (streaks, description) => {
        if (!streaks || streaks.length === 0) {
            resultContainer.innerHTML = '<p class="text-gray-500">Không có chuỗi nào phù hợp với điều kiện lọc.</p>';
            return;
        }
        const sortedStreaks = streaks.sort((a, b) => parseDate(b.endDate) - parseDate(a.endDate));
        let content = sortedStreaks.map(streak => `
                    <div class="py-3 border-b border-gray-200 last:border-b-0">
                        <p class="font-semibold">${formatStreakValue(streak, description)}</p>
                        <p class="text-sm text-gray-600">${streak.startDate} đến ${streak.endDate} (${streak.length} ngày)</p>
                        <div class="flex flex-wrap gap-1 mt-1">${renderFullSequence(streak, description)}</div>
                    </div>`).join('');
        resultContainer.innerHTML = content;
    };

    // SỬA LỖI: Hàm này nhận 'description' để xác định cách hiển thị
    const renderFullSequence = (streak, description) => {
        if (!streak.fullSequence) return '<span></span>';
        const streakDates = new Set(streak.dates);

        const desc = (typeof description === 'string') ? description.toLowerCase() : '';
        const isTongTT = desc.includes('tổng tt');
        const isTongMoi = desc.includes('tổng mới');
        const isHieu = desc.includes('hiệu');

        return streak.fullSequence.map(day => {
            let subText = '';
            if (isTongTT) {
                subText = `<span class="block text-blue-600 font-semibold">T${getTongTT(day.value)}</span>`;
            } else if (isTongMoi) {
                subText = `<span class="block text-blue-600 font-semibold">T${getTongMoi(day.value)}</span>`;
            } else if (isHieu) {
                subText = `<span class="block text-green-600 font-semibold">H${getHieu(day.value)}</span>`;
            }
            return `
                        <div class="text-center p-1 rounded-md text-xs ${streakDates.has(day.date) ? 'highlight' : 'bg-gray-200'}">
                            <span class="font-mono text-base">${day.value}</span>
                            ${subText} 
                            <span class="block text-gray-500">${day.date.substring(0, 5)}</span>
                        </div>`;
        }).join('');
    };

    // SỬA LỖI: Hàm này nhận 'description' để xác định cách hiển thị
    const formatStreakValue = (streak, description) => {
        // Luôn kiểm tra description trước
        const desc = (typeof description === 'string') ? description.toLowerCase() : '';
        const isTongTT = desc.includes('tổng tt');
        const isTongMoi = desc.includes('tổng mới');
        const isHieu = desc.includes('hiệu');

        // Trường hợp "Các tổng" hoặc "Các hiệu"
        if ((isTongTT || isTongMoi || isHieu) && (desc.includes('tổng') || desc.includes('hiệu'))) {
            if (isTongTT) return streak.values.map(v => `<b>T${getTongTT(v)}</b>`).join(' → ');
            if (isTongMoi) return streak.values.map(v => `<b>T${getTongMoi(v)}</b>`).join(' → ');
            if (isHieu) return streak.values.map(v => `<b>H${getHieu(v)}</b>`).join(' → ');
        }

        // Các trường hợp còn lại
        if (streak.value) { return `<b>${streak.value}</b>`; }
        if (streak.pair) return `Cặp [<b>${streak.pair.join(', ')}</b>]`;
        return streak.values.map(v => `<b>${v}</b>`).join(' → ');
    };

    const toApiDateFormat = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    endDateInput.addEventListener('change', () => {
        const endDate = new Date(endDateInput.value);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 360);
        startDateInput.valueAsDate = startDate;
    });

    form.addEventListener('submit', handleStatsSubmit);
    initializePage();
});
