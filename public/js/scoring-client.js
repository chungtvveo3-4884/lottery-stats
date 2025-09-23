// public/js/scoring-client.js

document.addEventListener('DOMContentLoaded', function() {
    //======================================================================
    // I. KHAI BÁO BIẾN VÀ LẤY CÁC PHẦN TỬ DOM
    //======================================================================

    // Dữ liệu được nhúng từ server vào biến global 'serverData' trong file scoring.html
    const aggregateData = serverData.results || [];
    const scoringFormsData = serverData.scoringForms || [];
    let barChartInstance = null; // Biến để giữ instance của biểu đồ cột

    // Các phần tử chính trên trang
    const mainContent = document.getElementById('mainContent');
    const customSearchContainer = document.getElementById('customSearchResultsContainer');
    
    // Phần tử của Form
    const scoringForm = document.getElementById('scoringForm');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const searchButton = document.getElementById('searchButton');
    const searchButtonText = document.getElementById('searchButtonText');
    const searchSpinner = document.getElementById('searchSpinner');
    const checkboxGrid = document.getElementById('checkboxGrid');
    const occurrenceInputDiv = document.getElementById('occurrenceInput');
    const formsSelectionDiv = document.getElementById('formsSelection');


    //======================================================================
    // II. HÀM KHỞI TẠO CHÍNH VÀ LUỒNG LOGIC
    //======================================================================

    /**
     * Hàm chính, được gọi khi trang tải xong
     */
    function initializePage() {
        // Kiểm tra xem server có truyền dữ liệu không
        if (aggregateData.length > 0 && scoringFormsData.length > 0) {
            // Render các thành phần giao diện từ dữ liệu có sẵn
            renderStatusSummary(aggregateData);
            renderHeatmap(aggregateData);
            populateChartSelector(); // Đổ dữ liệu vào dropdown chọn biểu đồ
            generateCheckboxes(); // Tạo các checkbox chọn dạng số
        } else {
            // Hiển thị thông báo nếu không có dữ liệu
            const aggregateContainer = document.getElementById('aggregateResultsContainer');
            if(aggregateContainer){
                 aggregateContainer.innerHTML = `
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-r-lg" role="alert">
                        <p class="font-bold">Không có dữ liệu</p>
                        <p>Dữ liệu điểm tổng hợp chưa được tính toán. Vui lòng thử lại sau.</p>
                    </div>`;
            }
        }
        
        // Thiết lập các hàm lắng nghe sự kiện cho form và các nút bấm
        setupEventListeners();
        setDefaultDates();
    }

    /**
     * Thiết lập tất cả các hàm lắng nghe sự kiện
     */
    function setupEventListeners() {
        // 1. Sự kiện khi submit form tìm kiếm
        scoringForm.addEventListener('submit', handleSearchSubmit);

        // 2. Sự kiện thay đổi loại tìm kiếm (theo số lần về / theo dạng)
        document.querySelectorAll('input[name="searchType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const isOccurrence = e.target.value === 'occurrence';
                occurrenceInputDiv.style.display = isOccurrence ? 'block' : 'none';
                formsSelectionDiv.style.display = isOccurrence ? 'none' : 'block';
            });
        });

        // 3. Sự kiện cho các nút "Chọn tất cả" / "Bỏ chọn"
        const selectAllBtn = document.getElementById('selectAllForms');
        const clearAllBtn = document.getElementById('clearAllForms');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('#checkboxGrid input[type="checkbox"]').forEach(cb => cb.checked = true);
            });
        }
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                document.querySelectorAll('#checkboxGrid input[type="checkbox"]').forEach(cb => cb.checked = false);
            });
        }

        // 4. Sự kiện tự động tính ngày bắt đầu khi ngày kết thúc thay đổi
        endDateInput.addEventListener('change', setDefaultStartDate);
        // 5. Sự kiện click để đóng/mở hàng chi tiết trong bảng tổng hợp
        document.querySelectorAll('[data-toggle="collapse"]').forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.classList.toggle('hidden');
                }
            });
        });
    }


    //======================================================================
    // III. CÁC HÀM XỬ LÝ SỰ KIỆN (EVENT HANDLERS)
    //======================================================================

    /**
     * Xử lý khi người dùng nhấn nút tìm kiếm
     */
    async function handleSearchSubmit(e) {
        e.preventDefault(); // Ngăn trang tải lại
        
        // Vô hiệu hóa nút bấm và hiển thị spinner
        searchButton.disabled = true;
        searchButtonText.classList.add('hidden');
        searchSpinner.classList.remove('hidden');
        customSearchContainer.innerHTML = ''; // Xóa kết quả cũ

        // Lấy dữ liệu từ form
        const formData = new FormData(scoringForm);
        const searchType = formData.get('searchType');
        
        const body = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            mode: formData.get('mode'),
            searchType: searchType,
            occurrenceCount: formData.get('occurrenceCount'),
            selectedForms: Array.from(document.querySelectorAll('#checkboxGrid input:checked')).map(cb => cb.value)
        };

        // Gọi API tìm kiếm
        try {
            const response = await fetch('/api/scoring/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi từ server');
            }

            const resultData = await response.json();
            renderCustomSearchResults(resultData); // Hàm này sẽ ở phần 2

        } catch (error) {
            customSearchContainer.innerHTML = `<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg"><p><b>Lỗi khi tìm kiếm:</b> ${error.message}</p></div>`;
        } finally {
            // Kích hoạt lại nút bấm và ẩn spinner
            searchButton.disabled = false;
            searchButtonText.classList.remove('hidden');
            searchSpinner.classList.add('hidden');
        }
    }


    //======================================================================
    // IV. CÁC HÀM TIỆN ÍCH
    //======================================================================

    /**
     * Thiết lập ngày mặc định cho form
     */
    function setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        endDateInput.value = today;
        endDateInput.max = today;
        setDefaultStartDate();
    }
    
    function setDefaultStartDate() {
        const endDate = new Date(endDateInput.value);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 365); // Mặc định 1 năm
        const formattedStartDate = startDate.toISOString().split('T')[0];
        startDateInput.value = formattedStartDate;
    }

    /**
     * Tạo các checkbox chọn dạng số từ dữ liệu có sẵn
     */
    function generateCheckboxes() {
        if (!checkboxGrid || scoringFormsData.length === 0) return;
        
        const sortedForms = [...scoringFormsData].sort((a, b) => a.description.localeCompare(b.description, 'vi'));
        
        checkboxGrid.innerHTML = sortedForms.map((form, index) => {
            const safeId = `form_check_${index}`;
            return `
                <div class="flex items-center">
                    <input id="${safeId}" value="${form.n}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                    <label for="${safeId}" class="ml-2 block text-sm text-gray-900">${form.description}</label>
                </div>
            `;
        }).join('');
    }


    //======================================================================
    // V. CÁC HÀM RENDER (SẼ ĐƯỢC ĐỊNH NGHĨA Ở PHẦN SAU)
    //======================================================================
    
    /**
     * Render kết quả tìm kiếm tùy chỉnh vào khu vực hiển thị.
     * @param {object} data - Dữ liệu trả về từ API, có dạng { results, total, message, searchType }
     */
    function renderCustomSearchResults(data) {
        // Nếu không có dữ liệu hoặc không có kết quả, hiển thị thông báo.
        if (!data || !data.results || data.results.length === 0) {
            customSearchContainer.innerHTML = `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-r-lg mt-8" role="alert">
                    <p class="font-bold">Không tìm thấy kết quả</p>
                    <p>${data.message || 'Không có dạng số nào khớp với tiêu chí tìm kiếm của bạn.'}</p>
                </div>`;
            return;
        }

        // Tạo chuỗi HTML cho từng hàng của bảng kết quả
        const tableRows = data.results.map(result => {
            let statusBadge = '';
            if (result.score < 0) {
                statusBadge = `<span class="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-md">Quá nhiều</span>`;
            } else if (result.score === 0) {
                statusBadge = `<span class="px-2 py-1 text-xs font-semibold text-black bg-yellow-400 rounded-md">Cân bằng</span>`;
            } else if (result.score >= 85) {
                statusBadge = `<span class="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-md">Rất tốt</span>`;
            } else {
                statusBadge = `<span class="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md">Trung bình</span>`;
            }

            const datesHtml = result.dates.length > 0
                ? `<div class="max-h-32 overflow-y-auto text-xs">
                       ${result.dates.map(date => `
                           <div>
                               <span class="text-gray-600">${date}:</span> 
                               <span class="font-bold text-red-600">${result.dateToNumbers[date].join(', ')}</span>
                           </div>`).join('')}
                   </div>`
                : `<span class="text-gray-400 text-sm">Không về</span>`;

            return `
                <tr class="hover:bg-gray-50">
                    <td class="p-3 font-semibold text-sm text-gray-800">${result.form}</td>
                    <td class="p-3">${datesHtml}</td>
                    <td class="p-3 text-center">
                        <span class="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">${result.multiplier}</span>
                    </td>
                    <td class="p-3 text-center">
                        <span class="px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-800 rounded-full">${result.occurrences}</span>
                    </td>
                    <td class="p-3 text-center font-bold text-lg ${result.score >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${result.score}
                    </td>
                    <td class="p-3 text-center">${statusBadge}</td>
                </tr>`;
        }).join('');

        // Gắn toàn bộ bảng HTML vào trang
        customSearchContainer.innerHTML = `
            <h3 class="text-3xl font-bold text-center mb-4 text-gray-700">Kết quả tìm kiếm tùy chỉnh</h3>
            <p class="text-center text-gray-600 mb-4">${data.message}</p>
            <div class="overflow-x-auto bg-white rounded-lg shadow">
                 <table class="w-full whitespace-nowrap">
                    <thead class="bg-gray-800 text-white">
                        <tr>
                            <th class="p-3 text-left text-sm font-semibold uppercase tracking-wider">Dạng số</th>
                            <th class="p-3 text-left text-sm font-semibold uppercase tracking-wider">Ngày về & Số</th>
                            <th class="p-3 text-center text-sm font-semibold uppercase tracking-wider">Hệ số</th>
                            <th class="p-3 text-center text-sm font-semibold uppercase tracking-wider">Lần về</th>
                            <th class="p-3 text-center text-sm font-semibold uppercase tracking-wider">Điểm</th>
                            <th class="p-3 text-center text-sm font-semibold uppercase tracking-wider">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    /**
     * Render các thẻ tóm tắt trạng thái (Khá, Trung Bình, Kém, v.v.)
     * @param {Array<Object>} data - Mảng kết quả điểm tổng hợp.
     */
    function renderStatusSummary(data) {
        const container = document.getElementById('statusSummaryContainer');
        if (!container) return;

        const statusGroups = {
            'Khá': [], 'Trung Bình': [], 'Cân Bằng': [], 'Kém': [], 'Rất Kém': []
        };

        data.forEach(result => {
            if (statusGroups[result.status]) {
                statusGroups[result.status].push(result.number);
            }
        });

        const displayConfig = [
            { title: 'Khá', class: 'green', icon: '⭐' },
            { title: 'Trung Bình', class: 'blue', icon: '👍' },
            { title: 'Cân Bằng', class: 'gray', icon: '😐' },
            { title: 'Kém', class: 'yellow', icon: '👎' },
            { title: 'Rất Kém', class: 'red', icon: '🔥' }
        ];

        container.innerHTML = displayConfig.map(config => {
            const numbers = statusGroups[config.title];
            const numbersHtml = numbers && numbers.length > 0
                ? numbers.map(num => `<span class="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 mr-1 mb-1">${num}</span>`).join('')
                : '<p class="text-xs text-gray-500 italic mt-2">Không có số nào.</p>';

            return `
                <div class="bg-white rounded-lg shadow p-4 flex flex-col">
                    <div class="flex justify-between items-center mb-2">
                        <h6 class="font-bold text-gray-700">${config.icon} ${config.title}</h6>
                        <span class="text-sm font-bold text-white bg-${config.class}-500 rounded-full px-2">${numbers.length}</span>
                    </div>
                    <div class="flex-grow">${numbersHtml}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * "Vẽ" biểu đồ nhiệt (heatmap) cho tất cả 100 số.
     * @param {Array<Object>} data - Mảng kết quả điểm tổng hợp.
     */
    function renderHeatmap(data) {
        const heatmapContainer = document.getElementById('scoreHeatmap');
        const legendContainer = document.getElementById('heatmapLegend');
        if (!heatmapContainer || !legendContainer) return;

        const resultsMap = new Map(data.map(item => [item.number, {
            class: item.statusClass, // Sử dụng trực tiếp class từ server
            score: item.totalScore
        }]));

        heatmapContainer.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const numberStr = String(i).padStart(2, '0');
            const result = resultsMap.get(numberStr);
            const cellClass = result ? result.class : 'bg-gray-200 text-gray-500'; // Mặc định màu xám
            const cellTitle = result ? `Số ${numberStr} | Điểm: ${result.score}` : `Số ${numberStr}`;
            
            heatmapContainer.innerHTML += `
                <div title="${cellTitle}" class="h-10 w-10 flex items-center justify-center font-bold text-white rounded-md cursor-pointer transition-transform hover:scale-110 ${cellClass}">
                    ${numberStr}
                </div>`;
        }
        
        const legendData = [
            { label: 'Khá', class: 'bg-green-500' },
            { label: 'Trung Bình', class: 'bg-blue-500' },
            { label: 'Cân Bằng', class: 'bg-gray-500' },
            { label: 'Kém', class: 'bg-yellow-500 text-black' },
            { label: 'Rất Kém', class: 'bg-red-500' }
        ];

        legendContainer.innerHTML = legendData.map(item => `
            <div class="flex items-center text-sm">
                <span class="w-4 h-4 rounded mr-2 ${item.class}"></span>
                <span>${item.label}</span>
            </div>`).join('');
    }

    /**
     * Đổ danh sách các dạng số vào dropdown để chọn xem biểu đồ.
     */
    function populateChartSelector() {
        const selector = document.getElementById('chartTypeSelector');
        if (!selector) return;

        const sortedForms = [...scoringFormsData].sort((a, b) => a.description.localeCompare(b.description, 'vi'));
        
        let optionsHtml = '<option value="aggregate">Tổng hợp (Biểu đồ nhiệt)</option>';
        optionsHtml += sortedForms.map(form => `<option value="${form.n}">${form.description}</option>`).join('');
        
        selector.innerHTML = optionsHtml;

        selector.addEventListener('change', (e) => updateChartDisplay(e.target.value));
    }

    /**
     * Chuyển đổi giữa biểu đồ nhiệt và biểu đồ cột.
     * @param {string} selectedValue - Giá trị của lựa chọn (ví dụ: 'aggregate' hoặc 'even-even').
     */
    function updateChartDisplay(selectedValue) {
        const heatmapWrapper = document.getElementById('heatmapWrapper');
        const barChartWrapper = document.getElementById('barChartWrapper');
        if (!heatmapWrapper || !barChartWrapper) return;
        
        if (selectedValue === 'aggregate') {
            heatmapWrapper.style.display = 'block';
            barChartWrapper.style.display = 'none';
        } else {
            heatmapWrapper.style.display = 'none';
            barChartWrapper.style.display = 'block';
            drawBarChart(selectedValue);
        }
    }

    /**
     * "Vẽ" biểu đồ cột chi tiết cho một dạng số cụ thể.
     * @param {string} formN - Mã của dạng số cần vẽ biểu đồ (ví dụ: 'even-even').
     */
    function drawBarChart(formN) {
        const barChartCanvas = document.getElementById('specificFormChart');
        if (!barChartCanvas) return;

        if (barChartInstance) {
            barChartInstance.destroy();
        }

        const selectedForm = scoringFormsData.find(f => f.n === formN);
        if (!selectedForm) return;

        const chartData = aggregateData
            .filter(numData => numData.contributingForms.some(f => f.formN === formN))
            .map(numData => ({
                label: numData.number,
                score: numData.totalScore,
                color: `rgba(${
                    numData.statusClass.includes('red') ? '220, 38, 38' :
                    numData.statusClass.includes('yellow') ? '234, 179, 8' :
                    numData.statusClass.includes('green') ? '22, 163, 74' :
                    numData.statusClass.includes('blue') ? '59, 130, 246' : '107, 114, 128'
                }, 0.7)`
            }))
            .sort((a, b) => b.score - a.score);

        barChartInstance = new Chart(barChartCanvas, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.label),
                datasets: [{
                    label: 'Điểm Tổng Hợp',
                    data: chartData.map(d => d.score),
                    backgroundColor: chartData.map(d => d.color),
                    borderColor: chartData.map(d => d.color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `Điểm của các số thuộc dạng: ${selectedForm.description}`,
                        font: { size: 16 }
                    }
                },
                scales: { y: { title: { display: true, text: 'Điểm Tổng Hợp' } } }
            }
        });
    }

    // --- GỌI HÀM KHỞI TẠO ĐỂ BẮT ĐẦU ---
    initializePage();
});