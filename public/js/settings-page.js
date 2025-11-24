// Settings Page JavaScript

function updateCurrentConfigDisplay() {
    const config = AppConfig.current;
    const display = {
        'Ngưỡng Gap': `${Math.round(config.GAP_THRESHOLD_PERCENT * 100)}%`,
        'Sử dụng minGap': config.USE_MIN_GAP ? 'Có' : 'Không',
        'Hiển thị màu nền': config.SHOW_PROBABILITY_BACKGROUNDS ? 'Có' : 'Không',
        'Highlight số': config.HIGHLIGHT_LAST_GAP ? 'Có' : 'Không'
    };
    document.getElementById('current-config').textContent = JSON.stringify(display, null, 2);
}

function loadSettings() {
    const config = AppConfig.current;

    document.getElementById('gap-threshold').value = Math.round(config.GAP_THRESHOLD_PERCENT * 100);
    document.getElementById('gap-threshold-value').textContent = Math.round(config.GAP_THRESHOLD_PERCENT * 100) + '%';
    document.getElementById('use-min-gap').checked = config.USE_MIN_GAP;
    document.getElementById('show-backgrounds').checked = config.SHOW_PROBABILITY_BACKGROUNDS;
    document.getElementById('highlight-gap').checked = config.HIGHLIGHT_LAST_GAP;

    updateCurrentConfigDisplay();
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white font-semibold`;
    notification.textContent = message;
    notification.classList.remove('hidden');

    setTimeout(() => notification.classList.add('hidden'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    // Update value display when slider changes
    document.getElementById('gap-threshold').addEventListener('input', (e) => {
        document.getElementById('gap-threshold-value').textContent = e.target.value + '%';
    });

    // Save settings
    document.getElementById('save-settings').addEventListener('click', () => {
        const newConfig = {
            GAP_THRESHOLD_PERCENT: parseFloat(document.getElementById('gap-threshold').value) / 100,
            USE_MIN_GAP: document.getElementById('use-min-gap').checked,
            SHOW_PROBABILITY_BACKGROUNDS: document.getElementById('show-backgrounds').checked,
            HIGHLIGHT_LAST_GAP: document.getElementById('highlight-gap').checked
        };

        AppConfig.save(newConfig);
        updateCurrentConfigDisplay();

        showNotification('✓ Đã lưu cài đặt thành công!', 'success');
    });

    // Reset settings
    document.getElementById('reset-settings').addEventListener('click', () => {
        if (confirm('Khôi phục về cài đặt mặc định?\n\nNgưỡng Gap: 15%\nSử dụng minGap: Có\nHiển thị màu: Có\nHighlight số: Có')) {
            AppConfig.reset();
            loadSettings();
            showNotification('✓ Đã khôi phục cài đặt mặc định!', 'success');
        }
    });

    // Update display when checkboxes change
    ['use-min-gap', 'show-backgrounds', 'highlight-gap'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateCurrentConfigDisplay);
    });
});
