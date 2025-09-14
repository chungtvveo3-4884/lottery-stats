// Xử lý các tab khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 360);
    const formattedStartDate = defaultStartDate.toISOString().split('T')[0];
    
    // Thiết lập giá trị mặc định cho ngày bắt đầu và kết thúc
    document.getElementById('startDate').value = formattedStartDate;
    document.getElementById('endDate').value = today;
    document.getElementById('startDateScoring').value = formattedStartDate;
    document.getElementById('endDateScoring').value = today;
    
    // Cập nhật ngày cập nhật dữ liệu
    updateLastUpdateDate();
    
    // Kích hoạt xử lý dropdown patternType nếu có
    if (document.getElementById('patternType')) {
        updatePatternSubtype();
    }
});

// Xử lý dropdown Dạng con dựa trên lựa chọn Dạng
function updatePatternSubtype() {
    const patternType = document.getElementById('patternType').value;
    const patternSubtype = document.getElementById('patternSubtype');
    
    // Xóa các option hiện tại
    patternSubtype.innerHTML = '<option value="all">Tất cả</option>';
    
    // Thêm các option mới dựa trên loại dạng đã chọn
    if (patternType === 'even_even') {
        const evenEvenOptions = [
            { value: 'all_even_even', text: 'Tất cả' },
            { value: 'even_head_gt4_even_tail_gt4', text: 'Đầu chẵn > 4 Đít chẵn > 4' },
            { value: 'even_head_lt4_even_tail_lt4', text: 'Đầu chẵn < 4 Đít chẵn < 4' },
            { value: 'even_head_lt4_even_tail_gt4', text: 'Đầu chẵn < 4 Đít chẵn > 4' },
            { value: 'even_head_gt4_even_tail_lt4', text: 'Đầu chẵn > 4 Đít chẵn < 4' },
            { value: 'even_head_eq4_even_tail_gt4', text: 'Đầu chẵn = 4 Đít chẵn > 4' },
            { value: 'even_tail_eq4_even_head_lt4', text: 'Đít chẵn = 4 Đầu chẵn < 4' },
            { value: 'even_tail_eq4_even_head_gt4', text: 'Đít chẵn = 4 Đầu chẵn > 4' },
            { value: 'even_head_eq4_even_tail_eq4', text: 'Đầu chẵn = 4 Đít chẵn = 4' }
        ];
        
        evenEvenOptions.forEach(option => {
            const newOption = document.createElement('option');
            newOption.value = option.value;
            newOption.textContent = option.text;
            patternSubtype.appendChild(newOption);
        });
    }
    // Có thể thêm các dạng khác ở đây trong tương lai
}

// Đăng ký sự kiện thay đổi cho dropdown Dạng
if (document.getElementById('patternType')) {
    document.getElementById('patternType').addEventListener('change', updatePatternSubtype);
}

// Xử lý form thống kê
document.getElementById('statForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const mode = document.getElementById('mode').value;
    const statFunction = document.getElementById('statFunction').value;
    const consecutiveDays = document.getElementById('consecutiveDays').value;
    const [baseUrl, queryString] = statFunction.split('?');
    let newUrl;
    if (queryString) {
        const params = new URLSearchParams(queryString);
        const n = params.get('n');
        const order = params.get('order');
        const parityType = params.get('parityType');
        const sumType = params.get('sumType');
        const sequenceType = params.get('sequenceType');
        const pattern = params.get('pattern');
        const sumRange = params.get('sumRange');
        if (n) {
            newUrl = `${baseUrl}?n=${n}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
        } else if (parityType && order) {
            newUrl = `${baseUrl}?parityType=${parityType}&order=${order}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
        } else if (sumType && sequenceType && pattern) {
            newUrl = `${baseUrl}?sumType=${sumType}&sequenceType=${sequenceType}&pattern=${pattern}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
        } else if (sumType && order) {
            newUrl = `${baseUrl}?sumType=${sumType}&order=${order}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
        } else if (sumType) {
            newUrl = `${baseUrl}?sumType=${sumType}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;  
        } else if (order) {
            newUrl = `${baseUrl}?order=${order}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
        } else if (sumRange) {
            newUrl = `${baseUrl}?sumRange=${sumRange}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
        }
        else {
            newUrl = `${baseUrl}?${queryString}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
        }
    } else {
        newUrl = `${baseUrl}?startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
    }
    window.location.href = newUrl;
});

// Xử lý form tính điểm
if (document.getElementById('scoringForm')) {
    document.getElementById('scoringForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const startDate = document.getElementById('startDateScoring').value;
        const endDate = document.getElementById('endDateScoring').value;
        const mode = document.getElementById('modeScoring').value;
        const patternType = document.getElementById('patternType').value;
        const patternSubtype = document.getElementById('patternSubtype').value;
        const baseScore = 90; // Mốc điểm mặc định là 90
        
        // Xây dựng URL cho API tính điểm
        let scoringUrl = `/scoring?startDate=${startDate}&endDate=${endDate}&mode=${mode}&baseScore=${baseScore}`;
        
        if (patternType !== 'all') {
            scoringUrl += `&patternType=${patternType}`;
        }
        
        if (patternSubtype !== 'all') {
            scoringUrl += `&patternSubtype=${patternSubtype}`;
        }
        
        // Sử dụng fetch API để lấy dữ liệu
        fetch(scoringUrl)
            .then(response => response.json())
            .then(data => {
                const resultsDiv = document.getElementById('scoringResults');
                // Xử lý và hiển thị kết quả tìm kiếm
                if (data.length === 0) {
                    resultsDiv.innerHTML = '<div class="alert alert-info">Không tìm thấy kết quả phù hợp.</div>';
                } else {
                    let resultsHtml = '<div class="card"><div class="card-body">';
                    resultsHtml += '<h4 class="card-title">Kết quả tìm kiếm</h4>';
                    resultsHtml += '<div class="table-responsive"><table class="table table-striped table-hover">';
                    resultsHtml += '<thead><tr><th>Ngày</th><th>Số</th><th>Dạng</th><th>Dạng con</th><th>Điểm</th></tr></thead>';
                    resultsHtml += '<tbody>';
                    
                    // Nhóm kết quả theo dạng con
                    const groupedData = {};
                    
                    data.forEach(item => {
                        const key = item.patternSubtype;
                        if (!groupedData[key]) {
                            groupedData[key] = {
                                patternType: item.patternType,
                                patternSubtype: item.patternSubtype,
                                score: item.score,
                                dates: [],
                                numbers: []
                            };
                        }
                        
                        // Thêm ngày và số nếu chưa có
                        if (!groupedData[key].dates.includes(item.date)) {
                            groupedData[key].dates.push(item.date);
                        }
                        if (!groupedData[key].numbers.includes(item.number)) {
                            groupedData[key].numbers.push(item.number);
                        }
                    });
                    
                    // Hiển thị kết quả đã nhóm
                    Object.values(groupedData).forEach(item => {
                        resultsHtml += `<tr>
                            <td>${item.dates.join(', ')}</td>
                            <td>${item.numbers.join(', ')}</td>
                            <td>${item.patternType}</td>
                            <td>${item.patternSubtype}</td>
                            <td>${item.score.toFixed(2)}</td>
                        </tr>`;
                    });
                    
                    resultsHtml += '</tbody></table></div></div></div>';
                    resultsDiv.innerHTML = resultsHtml;
                }
            })
            .catch(error => {
                console.error('Lỗi khi lấy dữ liệu:', error);
                document.getElementById('scoringResults').innerHTML = 
                    '<div class="alert alert-danger">Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.</div>';
            });
    });
}

// Xử lý sự kiện thay đổi ngày kết thúc
document.getElementById('endDate').addEventListener('change', function () {
    const endDateValue = this.value;
    if (endDateValue) {
        const endDate = new Date(endDateValue);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 360);
        const today = new Date();
        const todayFormatted = today.toISOString().split('T')[0];
        const startDateFormatted = startDate.toISOString().split('T')[0];
        document.getElementById('startDate').value = startDateFormatted;
        if (startDate > today) {
            document.getElementById('startDate').value = todayFormatted;
        }
    }
});

// Thiết lập tương tự cho tab điểm
if (document.getElementById('endDateScoring')) {
    document.getElementById('endDateScoring').addEventListener('change', function () {
        const endDateValue = this.value;
        if (endDateValue) {
            const endDate = new Date(endDateValue);
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 360);
            const today = new Date();
            const todayFormatted = today.toISOString().split('T')[0];
            const startDateFormatted = startDate.toISOString().split('T')[0];
            document.getElementById('startDateScoring').value = startDateFormatted;
            if (startDate > today) {
                document.getElementById('startDateScoring').value = todayFormatted;
            }
        }
    });
}

// Xử lý event sự thay đổi của statFunction
document.getElementById('statFunction').addEventListener('change', function () {
    const consecutiveDaysDropdown = document.getElementById('consecutiveDays');
    const selectedOption = this.value;

    const limitedTo5DaysFunctions = [
        '/odd-consecutive-heads',
        '/odd-consecutive-tails',
        '/odd-decreasing-heads',
        '/odd-decreasing-tails',
        '/even-increasing-heads',
        '/even-increasing-tails',
        '/even-decreasing-heads',
        '/even-decreasing-tails'
    ];

    const limitedTo10DaysFunctions = [
        '/increasing-heads',
        '/decreasing-heads',
        '/increasing-tails',
        '/decreasing-tails',
        '/consecutive-sum-increasing-numbers',
        '/consecutive-sum-decreasing-numbers',
        '/consecutive-sum-sequences?order=asc',
        '/consecutive-sum-sequences?order=desc'
    ];

    consecutiveDaysDropdown.innerHTML = '';

    if (limitedTo5DaysFunctions.includes(selectedOption)) {
        for (let i = 2; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} ngày`;
            consecutiveDaysDropdown.appendChild(option);
        }
    } else if (limitedTo10DaysFunctions.includes(selectedOption)) {
        for (let i = 2; i <= 10; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} ngày`;
            consecutiveDaysDropdown.appendChild(option);
        }
    } else if (selectedOption === '/alternating-heads' || selectedOption === '/alternating-tails' || selectedOption === '/soleSumSequences?sumType=traditional' || selectedOption === '/soleSumSequences?sumType=new') {
        for (let i = 3; i <= 20; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} ngày`;
            consecutiveDaysDropdown.appendChild(option);
        }
    } else {
        for (let i = 2; i <= 20; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} ngày`;
            consecutiveDaysDropdown.appendChild(option);
        }
    }
});

// Xử lý nút cập nhật dữ liệu
document.getElementById('updateDataButton').addEventListener('click', function () {
    updateData();
});

// Hàm định dạng ngày tháng
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Hàm cập nhật ngày cập nhật cuối cùng
function updateLastUpdateDate() {
    fetch('/api/last-update-date')
        .then(response => response.json())
        .then(data => {
            const lastUpdateDateElement = document.getElementById('lastUpdateDate');
            if (data.lastUpdateDate) {
                const formattedDate = formatDate(data.lastUpdateDate);
                lastUpdateDateElement.textContent = formattedDate;
            } else {
                lastUpdateDateElement.textContent = 'Không có dữ liệu';
            }
        })
        .catch(error => {
            console.error('Lỗi khi lấy ngày cập nhật:', error);
        });
}

// Hàm cập nhật dữ liệu
function updateData() {
    fetch('/api/update-data', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Dữ liệu đã được cập nhật thành công!');
            updateLastUpdateDate();
        } else {
            alert('Có lỗi xảy ra khi cập nhật dữ liệu.');
        }
    })
    .catch(error => {
        console.error('Lỗi khi cập nhật dữ liệu:', error);
        alert('Có lỗi xảy ra khi cập nhật dữ liệu.');
    });
}