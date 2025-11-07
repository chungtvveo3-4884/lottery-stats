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
    function setupTabs(){
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
            const response = await fetch('/api/analysis/latest');
            if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Lỗi không xác định'); }
            const data = await response.json();
            renderAnalysis(data);
        } catch (error) {
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

    function renderAnalysis(data) {
        if (!data || !data.danh) {
            analysisContent.innerHTML = `<p class="text-red-500">Lỗi: Dữ liệu phân tích không hợp lệ.</p>`;
            return;
        }
        const { date, basedOn, danh, betAmount, analysisDetails } = data;
        // SỬA LỖI NGÀY: Chuyển đổi YYYY-MM-DD sang định dạng địa phương
        const [year, month, day] = date.split('-');
        const formattedDate = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('vi-VN');
        
        let html = `<p class="text-sm text-gray-600 mb-1">Dự đoán cho ngày: <span class="font-bold">${formattedDate}</span></p>`;
        if (basedOn) {
            html += `<p class="text-sm text-gray-600 mb-4">Dựa trên kết quả: <span class="font-mono font-bold">${basedOn.join(', ')}</span></p>`;
        }
        html += `<p class="text-lg font-semibold text-gray-800 mb-4">Mức cược dự kiến: <span class="text-blue-600">${(betAmount || 0).toLocaleString()}k / số</span></p>`;
        
        if(analysisDetails && analysisDetails.topFactors) {
            html += `<h4 class="font-semibold mb-2">Các yếu tố thống kê ảnh hưởng:</h4>
                     <div class="flex flex-wrap gap-2 mb-4">${analysisDetails.topFactors.map(f => `<span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">${f[0]}</span>`).join('')}</div>`;
        }
        html += `<div>
                    <h4 class="font-semibold text-green-600 mb-2">Dàn Đánh (${danh.numbers.length} số)</h4>
                    <div class="number-grid p-2 bg-gray-100 rounded-md">${danh.numbers.map(n => `<div class="number-item bg-white">${n}</div>`).join('')}</div>
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
                    <td class="p-2 text-right">${(item.betAmount || 0).toLocaleString()}k</td>
                    <td class="p-2 text-right text-red-600">${dayBet.toLocaleString()}k</td>
                    <td class="p-2 text-right text-green-600">${dayWin.toLocaleString()}k</td>
                    <td class="p-2 text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}">${Math.round(profit).toLocaleString()}k</td>
                `;
            } else {
                resultHtml = `<td colspan="5" class="p-2 text-center text-gray-400">Chờ kết quả (Cược: ${(item.betAmount || 0).toLocaleString()}k/số)</td>`;
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
        if(chartCanvas){
            simulationChart = new Chart(chartCanvas, {
                type: 'line', data: { labels: [`Bắt đầu`, ...results.map(r => `Ngày ${r.day}`)], datasets: [{ label: 'Vốn', data: [initialCapital, ...results.map(r => r.endCapital)], borderColor: 'rgb(22, 163, 74)', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.1 }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    initializePage();
});