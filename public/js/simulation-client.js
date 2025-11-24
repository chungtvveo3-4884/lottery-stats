// public/js/simulation-client.js
document.addEventListener('DOMContentLoaded', () => {
    // --- KHAI BÁO BIẾN ---
    const tabAnalysis = document.getElementById('tab-analysis');
    const tabSimulation = document.getElementById('tab-simulation');
    const contentAnalysis = document.getElementById('content-analysis');
    const contentSimulation = document.getElementById('content-simulation');

    // Tab 1: Phân tích & Lịch sử
    const analysisContent = document.getElementById('analysisContent');
    const historyContent = document.getElementById('historyContent');

    // Tab 2: Giả lập
    const simulationForm = document.getElementById('simulationForm');
    const simulationResultsContainer = document.getElementById('simulationResultsContainer');
    let simulationChart = null;

    // --- HÀM KHỞI TẠO ---
    async function initializePage() {
        setupTabs();
        await loadLatestAnalysis();
        await loadPredictionHistory();
        simulationForm.addEventListener('submit', handleRunSimulation);
    }

    // --- QUẢN LÝ TABS ---
    function setupTabs() {
        tabAnalysis.classList.add('active'); // Mặc định mở tab đầu
        tabAnalysis.addEventListener('click', () => switchTab('analysis'));
        tabSimulation.addEventListener('click', () => switchTab('simulation'));
    }

    function switchTab(tabName) {
        contentAnalysis.classList.toggle('hidden', tabName !== 'analysis');
        contentSimulation.classList.toggle('hidden', tabName === 'analysis');
        tabAnalysis.classList.toggle('active', tabName === 'analysis');
        tabSimulation.classList.toggle('active', tabName !== 'analysis');
    }

    // --- LOGIC CHO TAB 1: PHÂN TÍCH & LỊCH SỬ ---
    async function loadLatestAnalysis() {
        try {
            // Build suggestions URL with config params
            const config = AppConfig.current;
            const suggestionsUrl = `/api/suggestions?gapThreshold=${config.GAP_THRESHOLD_PERCENT}&useMinGap=${config.USE_MIN_GAP}`;

            // Fetch both analysis and suggestions data
            const [analysisRes, suggestionsRes] = await Promise.all([
                fetch('/api/analysis/latest'),
                fetch(suggestionsUrl)
            ]);

            if (!analysisRes.ok) {
                const err = await analysisRes.json();
                throw new Error(err.error || 'Lỗi không xác định');
            }

            const data = await analysisRes.json();
            let suggestions = null;

            if (suggestionsRes.ok) {
                suggestions = await suggestionsRes.json();
                console.log('[DEBUG] Suggestions data:', {
                    hasExcluded: !!suggestions.excludedNumbers,
                    excludedLength: suggestions.excludedNumbers ? suggestions.excludedNumbers.length : 0,
                    hasExplanations: !!suggestions.explanations
                });
            } else {
                console.warn('[DEBUG] Failed to fetch suggestions:', suggestionsRes.status);
            }

            renderAnalysis(data, suggestions);
        } catch (error) {
            console.error('[DEBUG] Error loading analysis:', error);
            analysisContent.innerHTML = `<p class="text-red-500">Lỗi tải phân tích: ${error.message}</p>`;
        }
    }

    async function loadPredictionHistory() {
        try {
            const response = await fetch('/api/analysis/history');
            if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Lỗi không xác định'); }
            const data = await response.json();
            renderHistory(data.reverse());
        } catch (error) {
            historyContent.innerHTML = `<p class="text-red-500">Lỗi tải lịch sử: ${error.message}</p>`;
        }
    }

    function renderAnalysis(data, suggestions) {
        if (!data || !data.danh) {
            analysisContent.innerHTML = `<p class="text-red-500">Lỗi: Dữ liệu phân tích không hợp lệ.</p>`;
            return;
        }
        const { date, danh, betAmount, analysisDetails } = data;
        // SỬA LỖI NGÀY: Chuyển đổi YYYY-MM-DD sang định dạng địa phương
        const [year, month, day] = date.split('-');
        const formattedDate = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('vi-VN');

        let html = `<div class="mb-6">
            <p class="text-sm text-gray-600 mb-1">Dự đoán cho ngày: <span class="font-bold text-lg">${formattedDate}</span></p>
            <p class="text-lg font-semibold text-gray-800">Mức cược: <span class="text-blue-600">${(betAmount || 0).toLocaleString()}k / số</span></p>
        </div>`;

        // Display excluded numbers if available from suggestions
        if (suggestions && suggestions.excludedNumbers && suggestions.excludedNumbers.length > 0) {
            const excludedNums = suggestions.excludedNumbers;
            html += `
                <div class="mb-6">
                    <h3 class="text-xl font-bold text-red-600 mb-3">📛 SỐ LOẠI TRỪ (${excludedNums.length} số)</h3>
                    <div class="number-grid p-3 bg-red-50 rounded-lg max-h-40 overflow-auto border-2 border-red-200">
                        ${excludedNums.map(n => `<div class="number-item bg-white text-red-600 border border-red-300 font-semibold">${String(n).padStart(2, '0')}</div>`).join('')}
                    </div>
                </div>`;

            // Display exclusion factors (explanations)
            if (suggestions.explanations && suggestions.explanations.length > 0) {
                const excludeExplanations = suggestions.explanations.filter(e => e.type === 'exclude');
                if (excludeExplanations.length > 0) {
                    html += `
                        <div class="mb-6">
                            <h4 class="font-semibold text-gray-700 mb-2">Các yếu tố loại trừ (${excludeExplanations.length})</h4>
                            <div class="space-y-2 max-h-48 overflow-auto">
                                ${excludeExplanations.map(exp => `
                                    <div class="text-xs bg-red-50 p-2 rounded border-l-2 border-red-400">
                                        <div class="font-semibold text-red-800">${exp.title}</div>
                                        <div class="text-gray-600">${exp.explanation}</div>
                                        <div class="text-gray-500 mt-1">Loại trừ: ${exp.numbers ? exp.numbers.length : 0} số</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>`;
                }
            }
        } else if (analysisDetails) {
            // Fallback to simple display if suggestions not available
            html += `<div class="mb-6">
                <h3 class="text-xl font-bold text-red-600 mb-3">📛 SỐ LOẠI TRỪ (${analysisDetails.excludedCount || 0} số)</h3>
            </div>`;
        }

        html += `<div>
                    <h3 class="text-xl font-bold text-green-600 mb-3">✅ DÀN ĐÁNH (${danh.numbers.length} số)</h3>
                    <div class="number-grid p-3 bg-green-50 rounded-lg border-2 border-green-200">${danh.numbers.map(n => `<div class="number-item bg-white text-green-600 border border-green-300 font-semibold">${n}</div>`).join('')}</div>
                 </div>`;
        analysisContent.innerHTML = html;
    }

    function renderHistory(historyData) {
        if (historyData.length === 0) {
            historyContent.innerHTML = `<p class="text-gray-500">Chưa có lịch sử đối chiếu.</p>`;
            return;
        }

        let totalBet = 0;
        let totalWin = 0;

        let tableHtml = `<table class="w-full text-sm text-left">
                            <thead class="bg-gray-100 sticky top-0"><tr>
                                <th class="p-2">Ngày</th>
                                <th class="p-2 text-center">Số Về</th>
                                <th class="p-2 text-center">Số Đánh</th>
                                <th class="p-2 text-right">Cược/Số</th>
                                <th class="p-2 text-right">Tổng Cược</th>
                                <th class="p-2 text-right">Tổng Thắng</th>
                                <th class="p-2 text-right">Lãi/Lỗ Ròng</th>
                            </tr></thead>
                            <tbody>`;

        for (const item of historyData) {
            // SỬA LỖI NGÀY: Chuyển đổi YYYY-MM-DD sang định dạng địa phương
            const [year, month, day] = item.date.split('-');
            const date = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('vi-VN');

            // Số đánh column with expandable details
            const numbersHtml = item.danh && item.danh.numbers ? `
                <details class="cursor-pointer">
                    <summary class="text-blue-600 hover:text-blue-800">${item.danh.numbers.length} số</summary>
                    <div class="number-grid p-2 mt-2 bg-gray-100 rounded-md max-w-sm">
                        ${item.danh.numbers.map(n => `<div class="number-item text-xs ${item.result && n === item.result.winningNumber ? 'bg-green-500 text-white font-bold' : 'bg-white'}">${n}</div>`).join('')}
                    </div>
                </details>
            ` : '<span class="text-gray-400">-</span>';

            let resultHtml;

            if (item.result) {
                // SỬA LỖI: Truy cập đúng thuộc tính và có giá trị dự phòng
                const dayBet = item.result.totalBet || 0;
                const dayWin = item.result.winAmount || 0;
                const profit = item.result.profit || 0; // Đây là lãi/lỗ ròng đã tính cả lỗ dồn

                totalBet += dayBet;
                totalWin += dayWin;
                resultHtml = `
                    <td class="p-2 text-center"><span class="font-mono bg-blue-100 text-blue-800 rounded px-2 py-1">${item.result.winningNumber}</span></td>
                    <td class="p-2 text-center">${numbersHtml}</td>
                    <td class="p-2 text-right">${(item.betAmount || 0).toLocaleString()}k</td>
                    <td class="p-2 text-right text-red-600">${dayBet.toLocaleString()}k</td>
                    <td class="p-2 text-right text-green-600">${dayWin.toLocaleString()}k</td>
                    <td class="p-2 text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}">${Math.round(profit).toLocaleString()}k</td>
                `;
            } else {
                resultHtml = `
                    <td class="p-2 text-center"><span class="text-yellow-600 font-semibold">⏳ Chờ</span></td>
                    <td class="p-2 text-center">${numbersHtml}</td>
                    <td colspan="4" class="p-2 text-center text-gray-400">Chờ kết quả (Cược: ${(item.betAmount || 0).toLocaleString()}k/số)</td>`;
            }
            tableHtml += `<tr class="border-b hover:bg-gray-50"><td class="p-2 font-medium">${date}</td>${resultHtml}</tr>`;
        }
        tableHtml += `</tbody></table>`;

        const totalProfit = totalWin - totalBet;
        let summaryHtml = `
            <div class="mt-4 p-4 bg-gray-100 rounded-lg grid grid-cols-3 gap-4 text-center">
                <div><p class="text-sm text-gray-600">Tổng Vốn Cược</p><p class="text-xl font-bold text-red-600">${totalBet.toLocaleString()}k</p></div>
                <div><p class="text-sm text-gray-600">Tổng Tiền Thắng</p><p class="text-xl font-bold text-green-600">${totalWin.toLocaleString()}k</p></div>
                <div><p class="text-sm text-gray-600">Lãi/Lỗ Ròng</p><p class="text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}">${totalProfit.toLocaleString()}k</p></div>
            </div>
        `;
        historyContent.innerHTML = tableHtml + summaryHtml;
    }

    // --- LOGIC CHO TAB 2: MÔ PHỎNG GIẢ LẬP ---
    async function handleRunSimulation(e) {
        e.preventDefault();
        const button = document.getElementById('runSimButton'), text = document.getElementById('runSimButtonText'), spinner = document.getElementById('runSimSpinner');
        button.disabled = true; text.classList.add('hidden'); spinner.classList.remove('hidden');
        simulationResultsContainer.classList.add('hidden');

        const body = {
            simulationDays: simulationForm.querySelector('#simulationDays').value,
            initialCapital: simulationForm.querySelector('#initialCapital').value,
        };

        try {
            const response = await fetch('/api/simulation/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Lỗi không xác định'); }
            const { dailyResults, initialCapital } = await response.json();
            renderSimulationResults(dailyResults, initialCapital);
        } catch (error) {
            simulationResultsContainer.innerHTML = `<div class="p-4 text-red-600 bg-red-100 rounded-md"><b>Lỗi:</b> ${error.message}</div>`;
            simulationResultsContainer.classList.remove('hidden');
        } finally {
            button.disabled = false; text.classList.remove('hidden'); spinner.classList.add('hidden');
        }
    }

    function renderSimulationResults(results, initialCapital) {
        simulationResultsContainer.classList.remove('hidden');
        if (!results || results.length === 0) {
            simulationResultsContainer.innerHTML = `<p class="p-4 text-yellow-600 bg-yellow-100 rounded-md">Không đủ dữ liệu lịch sử để chạy mô phỏng.</p>`;
            return;
        }

        const finalCapital = results[results.length - 1].endCapital;
        const totalProfit = finalCapital - initialCapital;

        let tableHtml = `<table class="w-full text-sm">
                            <thead class="bg-gray-100 sticky top-0"><tr>
                                <th class="p-2 text-center">Ngày</th><th class="p-2 text-center">Số Về</th>
                                <th class="p-2 text-right">Cược/Số</th><th class="p-2 text-right">Tổng Cược</th>
                                <th class="p-2 text-right">Lãi/Lỗ (Ngày)</th><th class="p-2 text-right">Vốn Cuối</th>
                            </tr></thead>
                            <tbody>`;

        results.forEach(r => {
            if (r.error) {
                tableHtml += `<tr class="border-b"><td colspan="6" class="p-2 text-center font-bold text-red-700 bg-red-100">${r.error} (Cần cược ${r.totalBet.toLocaleString()}k)</td></tr>`;
                return;
            }

            const isWin = r.winAmount > 0;
            const dailyProfit = r.profit; // Đây là lãi/lỗ ròng của ngày

            tableHtml += `
                <tr class="border-b">
                    <td class="p-2 text-center">${r.day}</td>
                    <td class="p-2 text-center font-mono ${isWin ? 'text-green-600' : 'text-red-600'}">${r.winningNumber}</td>
                    <td class="p-2 text-right">${r.betAmount.toLocaleString()}k</td>
                    <td class="p-2 text-right">${r.totalBet.toLocaleString()}k</td>
                    <td class="p-2 text-right font-semibold ${dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}">${dailyProfit.toLocaleString()}k</td>
                    <td class="p-2 text-right font-bold ${r.endCapital <= 0 ? 'text-red-700' : ''}">${r.endCapital.toLocaleString()}k</td>
                </tr>
                <tr>
                    <td colspan="6" class="p-2 bg-gray-50">
                        <details><summary class="text-xs cursor-pointer">Xem 25 số đã đánh (Lỗ dồn: ${r.totalLossSoFar.toLocaleString()}k)</summary>
                        <div class="number-grid p-2 mt-2 bg-gray-200 rounded-md">${r.numbersBet.map(n => `<div class="number-item ${n === r.winningNumber ? 'bg-green-500 text-white' : 'bg-white'}">${n}</div>`).join('')}</div>
                        </details>
                    </td>
                </tr>`;
        });
        tableHtml += `</tbody></table>`;

        simulationResultsContainer.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Kết quả Giả lập</h2>
            <div class="grid grid-cols-2 gap-4 text-center mb-8">
                <div class="p-4 bg-gray-100 rounded-lg shadow"><p class="text-sm">Vốn cuối kỳ</p><p class="text-2xl font-bold ${finalCapital > 0 ? 'text-green-600' : 'text-red-600'}">${finalCapital.toLocaleString()}k</p></div>
                <div class="p-4 bg-gray-100 rounded-lg shadow"><p class="text-sm">Lãi/Lỗ</p><p class="text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}">${totalProfit.toLocaleString()}k</p></div>
            </div>
            <div class="mb-8" style="height: 300px;"><canvas id="simulationChart"></canvas></div>
            <div class="overflow-auto max-h-[500px]">${tableHtml}</div>`;

        if (simulationChart) simulationChart.destroy();
        const chartCanvas = document.getElementById('simulationChart');
        if (chartCanvas) {
            simulationChart = new Chart(chartCanvas, {
                type: 'line', data: { labels: [`Bắt đầu`, ...results.map(r => `Ngày ${r.day}`)], datasets: [{ label: 'Vốn', data: [initialCapital, ...results.map(r => r.endCapital)], borderColor: 'rgb(22, 163, 74)', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.1 }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    initializePage();
});