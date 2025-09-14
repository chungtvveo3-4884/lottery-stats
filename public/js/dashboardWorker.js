// File: public/js/dashboardWorker.js

// Import các hàm render dùng chung.
// Nếu file này không được tìm thấy, worker sẽ gửi lỗi về.
try {
    importScripts('/js/dashboardRenderers.js');

    self.onmessage = function(event) {
        try {
            const { data, names } = event.data;

            // Xử lý dữ liệu bằng các hàm đã import
            const longestRunsHtml = renderLongestRuns(data.overallStats, names);
            const recentStreaksResult = renderRecentStreaks(data.recentStreaks, data.overallStats, names);

            // Gửi kết quả (dưới dạng các chuỗi HTML) về lại luồng chính
            self.postMessage({
                success: true,
                longestRunsHtml: longestRunsHtml,
                recentStreaksHtml: recentStreaksResult.html,
                showNoStreaks: recentStreaksResult.showNoStreaks,
                latestDate: recentStreaksResult.latestDate
            });
        } catch (e) {
            // Nếu có lỗi trong quá trình xử lý, gửi tin nhắn lỗi về
            console.error("Lỗi bên trong Worker:", e);
            self.postMessage({ success: false, error: e.message, stack: e.stack });
        }
    };

} catch (e) {
    // Nếu có lỗi ngay từ đầu (ví dụ importScripts), gửi tin nhắn lỗi về
    console.error("Lỗi khởi tạo Worker:", e);
    self.postMessage({ success: false, error: 'Lỗi khởi tạo Worker: ' + e.message });
}