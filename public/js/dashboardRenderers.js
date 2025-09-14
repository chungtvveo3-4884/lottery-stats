function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function renderLongestRuns(data, statDisplayNames) {
    const formatStatName = (name) => statDisplayNames[name] || name;
    if (!data || Object.keys(data).length === 0) {
        return '<tr><td colspan="3" class="text-center">Không có dữ liệu.</td></tr>';
    }

    const formatRunsToHtml = (runData, statName, type, allStatData) => {
        const length = (type === 'record') ? allStatData.recordLength : allStatData.secondPlaceLength;
        if (length === 0 || !runData || runData.length === 0) {
            return `<strong class="d-block mb-1">${length} ngày</strong> <span class="text-muted fst-italic">Không có</span>`;
        }

        const uniqueId = `${statName}-${type}`.replace(/\W/g, '');
        
        let runsListHtml = '';
        runData.forEach((run, index) => {
            if (!run.dates || !run.results) return;

            // [CẢI TIẾN] - Logic lấy "số gốc" hoặc "số đầu tiên của ngày" để hiển thị
            const rootNumbersSequence = run.results.map(dayResult => {
                const extractedNumbers = dayResult.extracted || dayResult.matched;
                if (extractedNumbers && extractedNumbers.length > 0) {
                    return String(extractedNumbers[0]).padStart(2, '0'); // Ưu tiên số gốc
                }
                if (dayResult.numbers && dayResult.numbers.length > 0) {
                    return String(dayResult.numbers[0]).padStart(2, '0'); // Nếu không có, lấy số đầu tiên của ngày
                }
                return '??'; // Trường hợp không có dữ liệu
            });

            const sequenceHtml = `<span class="badge bg-danger">${rootNumbersSequence.join(' → ')}</span>`;
            const dateString = `Từ ${formatDate(run.dates[0])} đến ${formatDate(run.dates[run.dates.length - 1])}`;

            runsListHtml += `
                <div class="list-group-item px-1 py-2">
                    <div class="result-sequence">${sequenceHtml}</div>
                    <small class="text-muted">${dateString}</small>
                </div>
            `;
        });

        return `
            <p class="mb-1">
                <button class="btn btn-outline-primary btn-sm w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#${uniqueId}">
                    <strong>${length} ngày</strong>
                    <span class="badge bg-secondary float-end">${runData.length} chuỗi</span>
                </button>
            </p>
            <div class="collapse" id="${uniqueId}">
                <div class="list-group list-group-flush">
                    ${runsListHtml}
                </div>
            </div>
        `;
    };

    let tableHtml = '';
    for (const [statName, statData] of Object.entries(data)) {
        tableHtml += `
            <tr>
                <td class="align-top"><strong>${formatStatName(statName)}</strong></td>
                <td class="align-top">${formatRunsToHtml(statData.recordRuns, statName, 'record', statData)}</td>
                <td class="align-top">${formatRunsToHtml(statData.secondPlaceRuns, statName, 'second', statData)}</td>
            </tr>`;
    }
    return tableHtml;
}

// File: public/js/dashboardRenderers.js

function renderRecentStreaks(data, overallStats, statDisplayNames) {
    const formatStatName = (name) => statDisplayNames[name] || name;
    if (!data || !data.latestDate || Object.keys(data.streaks).length === 0) {
        return { html: '', showNoStreaks: true, latestDate: data ? data.latestDate : null };
    }

    const renderedStreaks = new Set();
    const sortedLengths = Object.keys(data.streaks).sort((a, b) => b - a);
    let accordionHtml = '';

    sortedLengths.forEach(length => {
        const streaks = data.streaks[length];
        if (!streaks) return;
        
        const headerId = `header-${length}`;
        const collapseId = `collapse-${length}`;
        let listContent = '';

        streaks.forEach(streak => {
            if (renderedStreaks.has(streak.statName)) return;

            const statName = formatStatName(streak.statName);
            const historicalRecordLength = (overallStats && overallStats[streak.statName]) ? overallStats[streak.statName].recordLength : 0;
            
            if (streak.details) {
                streak.details.forEach(detail => {
                    let sequenceToDisplay = [];

                    // [CẢI TIẾN] - Logic hiển thị thông minh
                    if (detail.results && Array.isArray(detail.results)) {
                        // Ưu tiên 1: Lấy chuỗi "số gốc" nếu có
                        const rootNumbers = detail.results.map(dayResult => {
                            const extracted = dayResult.extracted || dayResult.matched;
                            if (extracted && extracted.length > 0) {
                                return extracted[0]; // Lấy số gốc đầu tiên
                            }
                            return null;
                        });
                        // Nếu tất cả các ngày đều có số gốc, sử dụng chuỗi này
                        if (rootNumbers.every(num => num !== null)) {
                            sequenceToDisplay = rootNumbers;
                        }
                    }
                    
                    // Ưu tiên 2: Nếu không có chuỗi số gốc đầy đủ, lấy chuỗi giá trị trừu tượng
                    if (sequenceToDisplay.length === 0) {
                        if (detail.sequence) sequenceToDisplay = detail.sequence;
                        else if (detail.numbers) sequenceToDisplay = detail.numbers;
                        else if (detail.number !== undefined) sequenceToDisplay = [detail.number];
                    }


                    if (sequenceToDisplay.length > 0) {
                        const resultSpans = sequenceToDisplay.map(n => `<span class="badge bg-danger">${String(n).padStart(2, '0')}</span>`).join(' → ');
                        const titleHtml = `<div><strong>${statName}</strong><span class="historical-record ms-2">[Kỷ lục: ${historicalRecordLength} ngày]</span></div>`;
                        listContent += `<li class="list-group-item">${titleHtml}<div class="result-sequence">${resultSpans}</div></li>`;
                    }
                });
            }
        });

        if (listContent) {
            streaks.forEach(streak => renderedStreaks.add(streak.statName));
            accordionHtml += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headerId}"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">Đang có chuỗi ${length} ngày</button></h2>
                    <div id="${collapseId}" class="accordion-collapse collapse show" data-bs-parent="#recent-streaks-accordion"><div class="accordion-body p-2"><ul class="list-group list-group-flush">${listContent}</ul></div></div>
                </div>`;
        }
    });
    return { html: accordionHtml, showNoStreaks: false, latestDate: data.latestDate };
}