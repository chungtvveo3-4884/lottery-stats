document.addEventListener('DOMContentLoaded', function () {
    const suggestionsSection = document.getElementById('suggestions-section');
    const suggestionsContainer = document.getElementById('suggestions-container');

    // Tự động tải gợi ý khi trang load
    loadSuggestions();

    async function loadSuggestions() {
        try {
            // Build URL with config params
            const config = AppConfig.current;
            const url = `/api/suggestions?gapThreshold=${config.GAP_THRESHOLD_PERCENT}&useMinGap=${config.USE_MIN_GAP}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Lỗi mạng khi tải gợi ý.');
            }
            const data = await response.json();
            renderSuggestions(data);
            suggestionsSection.style.display = 'block'; // Show the section
        } catch (error) {
            console.error('Lỗi khi tải gợi ý:', error);
            suggestionsContainer.innerHTML = `<div class="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">Không thể tải gợi ý. Vui lòng thử lại.</div>`;
            suggestionsSection.style.display = 'block';
        }
    }

    function renderSuggestions(data) {
        if (!data || (!data.explanations && !data.excludedNumbers)) {
            suggestionsContainer.innerHTML = `<div class="p-4 text-sm text-blue-700 bg-blue-100 rounded-lg" role="alert">Hiện tại không có gợi ý nào nổi bật.</div>`;
            suggestionsContainer.style.display = 'block';
            return;
        }

        // Phần tổng hợp các số NÊN ÔM
        let numbersToBetHtml = '';
        if (data.numbersToBet && data.numbersToBet.length > 0) {
            data.numbersToBet.forEach(num => {
                numbersToBetHtml += `<span class="inline-block bg-green-600 text-white text-sm font-semibold mr-2 px-2.5 py-1 rounded-full">${String(num).padStart(2, '0')}</span>`;
            });
        } else {
            numbersToBetHtml = '<span class="text-gray-500">Không có số nào được đề xuất để ôm.</span>';
        }

        // Phần tổng hợp các số LOẠI TRỪ
        let excludedNumbersHtml = '';
        if (data.excludedNumbers && data.excludedNumbers.length > 0) {
            excludedNumbersHtml = '<div class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">';
            data.excludedNumbers.forEach(num => {
                excludedNumbersHtml += `<div class="flex justify-center"><span class="inline-block bg-red-600 text-white text-base font-bold px-3 py-2 rounded shadow-sm w-12 text-center">${String(num).padStart(2, '0')}</span></div>`;
            });
            excludedNumbersHtml += '</div>';
        } else {
            excludedNumbersHtml = '<span class="text-gray-500 italic">Không có số nào bị loại trừ hôm nay.</span>';
        }

        // Phần giải thích chi tiết
        let explanationsHtml = '';
        if (data.explanations) {
            data.explanations.forEach(item => {
                const isBetOn = item.type === 'bet-on';
                const isExclude = item.type === 'exclude';

                let cardBorderClass, headerBgClass, titleClass, numberBadgeClass;

                if (isBetOn) {
                    cardBorderClass = 'border-green-500';
                    headerBgClass = 'bg-green-100';
                    titleClass = 'text-green-800';
                    numberBadgeClass = 'bg-green-600';
                } else if (isExclude) {
                    cardBorderClass = 'border-red-500';
                    headerBgClass = 'bg-red-100';
                    titleClass = 'text-red-800';
                    numberBadgeClass = 'bg-red-600';
                } else {
                    cardBorderClass = 'border-yellow-500';
                    headerBgClass = 'bg-yellow-100';
                    titleClass = 'text-yellow-800';
                    numberBadgeClass = 'bg-gray-400';
                }

                let numbersHtml = '';
                if (item.numbers && item.numbers.length > 0) {
                    numbersHtml = '<div class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">';
                    item.numbers.forEach(num => {
                        numbersHtml += `<div class="flex justify-center"><span class="inline-block ${numberBadgeClass} text-white text-sm font-semibold px-2 py-1 rounded w-10 text-center">${String(num).padStart(2, '0')}</span></div>`;
                    });
                    numbersHtml += '</div>';
                }

                explanationsHtml += `
                            <div class="bg-white rounded-lg shadow-sm border-l-4 ${cardBorderClass} mb-4">
                                <div class="p-4 rounded-t-lg ${headerBgClass}">
                                    <strong class="font-semibold ${titleClass}">${item.title}</strong>
                                </div>
                                <div class="p-4">
                                    <p class="text-gray-700 text-sm mb-3">${item.explanation}</p>
                                    <p class="text-xs font-semibold text-gray-600 mb-2">CÁC SỐ BỊ LOẠI TRỪ:</p>
                                    ${numbersHtml}
                                </div>
                            </div>`;
            });
        }

        // Gộp tất cả lại với UI Collapsible (Mặc định đóng)
        const finalHtml = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                <button id="toggleSuggestionsBtn" class="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 transition-colors text-left group">
                    <span class="text-lg font-bold text-red-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                        GỢI Ý LOẠI TRỪ (BẤM ĐỂ XEM CHI TIẾT)
                    </span>
                    <svg id="toggleIcon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 transform transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                
                <div id="suggestionsContent" class="hidden border-t border-gray-200 p-4 bg-white">
                    <div class="mb-6">
                        <h6 class="font-bold text-gray-800 mb-3">CÁC SỐ NÊN ÔM (LOẠI TRỪ - KHÓ VỀ):</h6>
                        ${excludedNumbersHtml}
                    </div>
                    
                    <hr class="my-4">
                    <h5 class="text-lg font-bold text-gray-900 mb-3">GIẢI THÍCH CHI TIẾT:</h5>
                    ${explanationsHtml}
                </div>
            </div>
        `;

        suggestionsContainer.innerHTML = finalHtml;
        suggestionsContainer.style.display = 'block';

        // Add toggle functionality
        const btn = document.getElementById('toggleSuggestionsBtn');
        const content = document.getElementById('suggestionsContent');
        const icon = document.getElementById('toggleIcon');

        if (btn && content && icon) {
            btn.addEventListener('click', () => {
                content.classList.toggle('hidden');
                icon.classList.toggle('rotate-180');
            });
        }
    }
});
