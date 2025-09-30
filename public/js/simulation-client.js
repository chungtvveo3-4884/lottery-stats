// public/js/simulation-client.js

document.addEventListener('DOMContentLoaded', () => {
    const analysisContent = document.getElementById('analysisContent');
    const historyContent = document.getElementById('historyContent');
    const simulationForm = document.getElementById('simulationForm');
    const resultsContainer = document.getElementById('resultsContainer');
    let simulationChart = null;

    async function initializePage() {
        await loadLatestAnalysis();
        await loadPredictionHistory();
        simulationForm.addEventListener('submit', handleRunSimulation);
    }

    async function loadLatestAnalysis() {
        try {
            const response = await fetch('/api/analysis/latest');
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Lỗi không xác định');
            }
            const data = await response.json();
            renderAnalysis(data);
        } catch (error) {
            analysisContent.innerHTML = `<p class="text-red-500">Lỗi tải phân tích: ${error.message}</p>`;
        }
    }

    async function loadPredictionHistory() {
        try {
            const response = await fetch('/api/analysis/history');
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Lỗi không xác định');
            }
            const data = await response.json();
            renderHistory(data.reverse());
        } catch (error) {
            historyContent.innerHTML = `<p class="text-red-500">Lỗi tải lịch sử: ${error.message}</p>`;
        }
    }

    function renderAnalysis(data) {
        const { basedOn, mostLikely, leastLikely, analysisDetails } = data;
        
        let html = `<p class="text-sm text-gray-600 mb-4">Dựa trên kết quả 3 ngày gần nhất: <span class="font-mono font-bold">${basedOn.join(', ')}</span></p>`;
        html += `<h4 class="font-semibold mb-2">Các yếu tố thống kê ảnh hưởng nhất:</h4>
                 <div class="flex flex-wrap gap-2 mb-4">
                    ${analysisDetails.topFactors.map(factor => `<span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">${factor[0]}</span>`).join('')}
                 </div>`;
        html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold text-green-600 mb-2">Dàn Đánh (${mostLikely.length} số)</h4>
                        <div class="number-grid p-2 bg-gray-100 rounded-md">${mostLikely.map(num => `<div class="number-item bg-white">${num}</div>`).join('')}</div>
                    </div>
                    <div>
                        <h4 class="font-semibold text-red-600 mb-2">Dàn Ôm (${leastLikely.length} số)</h4>
                        <div class="number-grid p-2 bg-gray-100 rounded-md">${leastLikely.map(num => `<div class="number-item bg-white">${num}</div>`).join('')}</div>
                    </div>
                 </div>`;
        analysisContent.innerHTML = html;
    }

    function renderHistory(historyData) {
        if(historyData.length === 0){
            historyContent.innerHTML = `<p class="text-gray-500">Chưa có lịch sử đối chiếu nào.</p>`;
            return;
        }
        let tableHtml = `<table class="w-full text-sm text-left">
                            <thead class="bg-gray-100 sticky top-0"><tr><th class="p-2">Ngày</th><th class="p-2 text-center">Số Về</th><th class="p-2 text-right">L/L Ôm</th><th class="p-2 text-right">L/L Đánh</th></tr></thead>
                            <tbody>`;
        for(const item of historyData){
            const omResult = item.results.omWinLoss;
            const danhResult = item.results.danhWinLoss;
            tableHtml += `<tr class="border-b hover:bg-gray-50">
                            <td class="p-2">${new Date(item.date).toLocaleDateString('vi-VN')}</td>
                            <td class="p-2 text-center"><span class="font-mono bg-blue-100 text-blue-800 rounded px-2 py-1">${item.winningNumber}</span></td>
                            <td class="p-2 text-right font-semibold ${omResult >= 0 ? 'text-green-600' : 'text-red-600'}">${Math.round(omResult).toLocaleString()}k</td>
                            <td class="p-2 text-right font-semibold ${danhResult >= 0 ? 'text-green-600' : 'text-red-600'}">${Math.round(danhResult).toLocaleString()}k</td>
                         </tr>`;
        }
        tableHtml += `</tbody></table>`;
        historyContent.innerHTML = tableHtml;
    }

    async function handleRunSimulation(e) {
        e.preventDefault();
        const button = document.getElementById('runButton');
        const buttonText = document.getElementById('runButtonText');
        const spinner = document.getElementById('runSpinner');

        button.disabled = true;
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');
        resultsContainer.classList.add('hidden');

        const body = {
            simulationDays: document.getElementById('simulationDays').value,
            initialCapital: document.getElementById('initialCapital').value,
            betAmount: document.getElementById('betAmount').value
        };

        try {
            const response = await fetch('/api/simulation/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error);
            }
            const { dailyResults, initialCapital } = await response.json();
            renderSimulationResults(dailyResults, initialCapital);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="text-red-600 bg-red-100 p-4 rounded-md"><b>Lỗi:</b> ${error.message}</div>`;
            resultsContainer.classList.remove('hidden');
        } finally {
            button.disabled = false;
            buttonText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }

    function renderSimulationResults(results, initialCapital){
        resultsContainer.classList.remove('hidden');
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `<p class="p-4 text-yellow-600 bg-yellow-100 rounded-md">Không có đủ dữ liệu lịch sử để chạy mô phỏng với số ngày đã chọn.</p>`;
            return;
        }
        const finalCapital = results[results.length - 1].endCapital;
        const totalProfit = finalCapital - initialCapital;

        let detailedHtml = '';
        results.forEach(dayResult => {
             detailedHtml += `
            <div class="border rounded-lg shadow-sm overflow-hidden bg-white mb-4">
                <div class="p-4 bg-gray-50 border-b grid grid-cols-3 items-center gap-4">
                    <div class="col-span-1">
                        <h3 class="font-bold text-lg">Ngày ${dayResult.day}</h3>
                        <p class="text-sm text-gray-500">${dayResult.date}</p>
                    </div>
                    <div class="text-center">
                        <span class="text-sm text-gray-600">Số về (Giả lập):</span>
                        <span class="font-mono text-3xl font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-md">${dayResult.winningNumber}</span>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">Vốn cuối ngày</p>
                        <p class="font-bold text-xl ${dayResult.endCapital >= initialCapital ? 'text-gray-800' : 'text-red-600'}">${Math.round(dayResult.endCapital).toLocaleString()}k</p>
                    </div>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <p class="font-semibold text-gray-700">Ôm (${dayResult.om.numbers.length} số)</p>
                            <p class="font-semibold text-sm ${dayResult.om.winLoss >= 0 ? 'text-green-600' : 'text-red-600'}">${dayResult.om.winLoss >= 0 ? '+' : ''}${Math.round(dayResult.om.winLoss).toLocaleString()}k</p>
                        </div>
                        <div class="number-grid p-2 bg-gray-100 rounded-md max-h-24 overflow-y-auto">${dayResult.om.numbers.map(num => `<div class="number-item ${num === dayResult.winningNumber ? 'bg-red-500 text-white' : 'bg-white'}">${num}</div>`).join('')}</div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <p class="font-semibold text-gray-700">Đánh (${dayResult.danh.numbers.length} số)</p>
                            <p class="font-semibold text-sm ${dayResult.danh.winLoss >= 0 ? 'text-green-600' : 'text-red-600'}">${dayResult.danh.winLoss >= 0 ? '+' : ''}${Math.round(dayResult.danh.winLoss).toLocaleString()}k</p>
                        </div>
                        <div class="number-grid p-2 bg-gray-100 rounded-md max-h-24 overflow-y-auto">${dayResult.danh.numbers.map(num => `<div class="number-item ${num === dayResult.winningNumber ? 'bg-green-500 text-white' : 'bg-white'}">${num}</div>`).join('')}</div>
                    </div>
                </div>
            </div>`;
        });
        
        resultsContainer.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Kết quả Mô phỏng</h2>
            <div class="grid grid-cols-2 gap-4 text-center mb-8">
                <div class="p-4 bg-gray-100 rounded-lg shadow"><p class="text-sm text-gray-500">Vốn cuối kỳ</p><p class="text-2xl font-bold ${finalCapital >= initialCapital ? 'text-green-600' : 'text-red-600'}">${Math.round(finalCapital).toLocaleString()}k</p></div>
                <div class="p-4 bg-gray-100 rounded-lg shadow"><p class="text-sm text-gray-500">Lãi/Lỗ</p><p class="text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}">${Math.round(totalProfit).toLocaleString()}k</p></div>
            </div>
            <div class="mb-8" style="height: 300px;"><canvas id="simulationChart"></canvas></div>
            <div class="overflow-auto max-h-[500px]">${detailedHtml}</div>`;
        
        if (simulationChart) simulationChart.destroy();
        const chartCanvas = document.getElementById('simulationChart');
        if (chartCanvas) {
            simulationChart = new Chart(chartCanvas, {
                type: 'line',
                data: { 
                    labels: [`Bắt đầu`, ...results.map(r => `Ngày ${r.day}`)], 
                    datasets: [{ label: 'Vốn', data: [initialCapital, ...results.map(r => r.endCapital)], borderColor: 'rgb(79, 70, 229)', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.1 }] 
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    initializePage();
});