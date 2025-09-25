// public/js/simulation-client.js (Đã tái cấu trúc)

document.addEventListener('DOMContentLoaded', async () => {
    const simulationForm = document.getElementById('simulationForm');
    const resultsContainer = document.getElementById('resultsContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const chartCanvas = document.getElementById('simulationChart');
    const formGroupsContainer = document.getElementById('formGroupsContainer');
    const addFormGroupBtn = document.getElementById('addFormGroup');
    const runButton = document.getElementById('runButton');
    const runButtonText = document.getElementById('runButtonText');
    const runSpinner = document.getElementById('runSpinner');

    let scoringForms = [];
    let simulationChart = null;
    let groupCounter = 1;

    async function initializePage() {
        try {
            const response = await fetch('/api/scoring/forms');
            if (!response.ok) throw new Error('Không thể tải các dạng số');
            scoringForms = await response.json();
            addFormGroup();
            setupEventListeners();
        } catch (error) {
            console.error("Lỗi khởi tạo:", error);
            if(formGroupsContainer) {
                formGroupsContainer.innerHTML = `<p class="text-red-500">Lỗi: Không thể tải danh sách các dạng số.</p>`;
            }
        }
    }

    function setupEventListeners(){
        if(addFormGroupBtn) addFormGroupBtn.addEventListener('click', addFormGroup);
        if(simulationForm) simulationForm.addEventListener('submit', handleRunSimulation);
    }
    
    function addFormGroup() {
        const groupId = `group-${groupCounter++}`;
        const newGroup = document.createElement('div');
        newGroup.className = 'form-group p-4 border rounded-lg bg-gray-50 relative space-y-4';
        newGroup.id = groupId;

        const sortedForms = [...scoringForms].sort((a, b) => a.description.localeCompare(b.description, 'vi'));
        const optionsHtml = sortedForms.map(form => `<option value="${form.n}">${form.description}</option>`).join('');

        newGroup.innerHTML = `
            <button type="button" class="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-700" onclick="document.getElementById('${groupId}').remove();">&times;</button>
            <div>
                <label for="formSelect-${groupId}" class="block text-sm font-medium text-gray-700">Chọn Dạng Số</label>
                <select name="formSelect" id="formSelect-${groupId}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    ${optionsHtml}
                </select>
            </div>
            <div>
                <label for="betAmount-${groupId}" class="block text-sm font-medium text-gray-700">Mức cược (ví dụ: 10 cho 10k)</label>
                <input type="number" name="betAmount" id="betAmount-${groupId}" value="10" min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            </div>
        `;
        if(formGroupsContainer) formGroupsContainer.appendChild(newGroup);
    }

    async function handleRunSimulation(e) {
        e.preventDefault();
        runButton.disabled = true;
        runButtonText.classList.add('hidden');
        runSpinner.classList.remove('hidden');
        resultsContainer.classList.add('hidden');

        const formData = new FormData(simulationForm);
        const formGroups = Array.from(document.querySelectorAll('.form-group')).map(group => ({
            formN: group.querySelector('select[name="formSelect"]').value,
            betAmount: group.querySelector('input[name="betAmount"]').value
        }));

        const body = {
            simulationDays: formData.get('simulationDays'),
            initialCapital: formData.get('initialCapital'),
            formGroups: formGroups
        };

        try {
            const response = await fetch('/api/simulation/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi không xác định từ server');
            }
            
            const { dailyResults, initialCapital } = await response.json();
            renderResults(dailyResults, initialCapital);

        } catch (error) {
            console.error("Lỗi khi chạy mô phỏng:", error);
            summaryContainer.innerHTML = `<div class="text-red-600 bg-red-100 p-4 rounded-md"><b>Lỗi:</b> ${error.message}</div>`;
            resultsContainer.classList.remove('hidden');
        } finally {
            runButton.disabled = false;
            runButtonText.classList.remove('hidden');
            runSpinner.classList.add('hidden');
        }
    }
    
    function renderResults(results, initialCapital) {
        resultsContainer.classList.remove('hidden');
        const finalCapital = results.length > 0 ? results[results.length - 1].endCapital : initialCapital;
        const totalProfit = finalCapital - initialCapital;
        const maxCapital = Math.max(...results.map(r => r.endCapital), initialCapital);
        const minCapital = Math.min(...results.map(r => r.endCapital), initialCapital);

        summaryContainer.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div class="p-4 bg-gray-100 rounded-lg shadow"><p class="text-sm text-gray-500">Vốn cuối kỳ</p><p class="text-2xl font-bold ${finalCapital >= initialCapital ? 'text-green-600' : 'text-red-600'}">${finalCapital.toLocaleString()}k</p></div>
                <div class="p-4 bg-gray-100 rounded-lg shadow"><p class="text-sm text-gray-500">Lãi/Lỗ</p><p class="text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}">${totalProfit.toLocaleString()}k</p></div>
                <div class="p-4 bg-gray-100 rounded-lg shadow"><p class="text-sm text-gray-500">Vốn cao nhất</p><p class="text-2xl font-bold text-blue-600">${maxCapital.toLocaleString()}k</p></div>
                <div class="p-4 bg-gray-100 rounded-lg shadow"><p class="text-sm text-gray-500">Vốn thấp nhất</p><p class="text-2xl font-bold text-orange-600">${minCapital.toLocaleString()}k</p></div>
            </div>
        `;
        
        resultsTableBody.innerHTML = results.map(r => `
            <tr class="border-b hover:bg-gray-50"><td class="p-2 text-center">${r.day}</td><td class="p-2 text-center font-mono bg-blue-100 text-blue-800 rounded">${r.winningNumber}</td><td class="p-2 text-right text-red-600">${r.dailyBet.toLocaleString()}</td><td class="p-2 text-right text-green-600">${r.dailyWin.toLocaleString()}</td><td class="p-2 text-right font-semibold ${r.dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}">${r.dailyProfit.toLocaleString()}</td><td class="p-2 text-right font-bold">${r.endCapital.toLocaleString()}</td></tr>
        `).join('');

        if (simulationChart) simulationChart.destroy();
        
        simulationChart = new Chart(chartCanvas, {
            type: 'line',
            data: { labels: results.map(r => `Ngày ${r.day}`), datasets: [{ label: 'Vốn', data: results.map(r => r.endCapital), borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.1 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Biến động vốn qua các ngày' } } }
        });
    }

    initializePage();
});