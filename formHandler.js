// formHandler.js
export function initializeFormHandlers() {
    // Tự động chọn ngày kết thúc khi ngày bắt đầu thay đổi
    document.getElementById('startDate').addEventListener('change', function () {
        const startDate = new Date(this.value);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 359);

        const today = new Date().toISOString().split('T')[0];
        const endDateFormatted = endDate.toISOString().split('T')[0];

        document.getElementById('endDate').value = endDateFormatted > today ? today : endDateFormatted;
    });

    // Điều chỉnh dropdown "Số ngày về liên tiếp" khi chọn chức năng thống kê
    document.getElementById('statFunction').addEventListener('change', function () {
        const consecutiveDaysDropdown = document.getElementById('consecutiveDays');
        const selectedOption = this.value;

        if (selectedOption === '/alternating-heads' || selectedOption === '/alternating-tails') {
            consecutiveDaysDropdown.innerHTML = '';
            for (let i = 4; i <= 10; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i} ngày`;
                consecutiveDaysDropdown.appendChild(option);
            }
        } else {
            consecutiveDaysDropdown.innerHTML = '';
            for (let i = 3; i <= 10; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i} ngày`;
                consecutiveDaysDropdown.appendChild(option);
            }
        }
    });

    // Xử lý submit form
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
            if (n) {
                newUrl = `${baseUrl}?n=${n}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
            } else {
                newUrl = `${baseUrl}?${queryString}&startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
            }
        } else {
            newUrl = `${baseUrl}?startDate=${startDate}&endDate=${endDate}&mode=${mode}&consecutiveDays=${consecutiveDays}`;
        }
        window.location.href = newUrl;
    });
}