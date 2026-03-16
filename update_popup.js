const fs = require('fs');
let content = fs.readFileSync('views/statistics.html', 'utf8');

const startIdx = content.indexOf('<!-- Modal Thông báo Phiên bản Mới -->');
const endIdx = content.indexOf('</div>\n    </div>\n    <style>', startIdx);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find modal bounds');
    process.exit(1);
}

const oldModalContent = content.substring(startIdx, endIdx);

const newModalContent = `<!-- Modal Thông báo Phiên bản Mới -->
    <div id="versionModal"
        class="fixed inset-0 z-50 hidden bg-gray-900 bg-opacity-70 flex items-center justify-center p-4">
        <div
            class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-[scale_0.3s_ease-out]">
            <!-- Header -->
            <div
                class="bg-gradient-to-r from-purple-700 to-indigo-800 p-5 flex justify-between items-center text-white">
                <div>
                    <h2 class="text-2xl font-bold flex items-center gap-2">
                        <i class="bi bi-rocket-takeoff-fill text-yellow-300"></i>
                        Cập nhật Phiên bản v2.2
                    </h2>
                    <p class="text-indigo-200 text-sm mt-1">Bản build: 08/03/2026 - Tối ưu hóa Toàn Diện</p>
                </div>
                <button id="closeVersionModalBtn"
                    class="text-indigo-200 hover:text-white transition rounded-full p-1 bg-white/10 hover:bg-white/20">
                    <i class="bi bi-x-lg text-xl"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto custom-scrollbar flex-1 text-gray-700 bg-gray-50">
                <div class="mb-6">
                    <p class="mb-3 text-lg">Hệ thống đã được cập nhật phiên bản lớn giúp <strong
                            class="text-purple-700">Tốc độ truy xuất và Lọc số thông minh</strong> vượt trội hơn.</p>
                </div>

                <div class="space-y-4">
                    <div class="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden">
                        <h3 class="text-[15px] font-bold text-indigo-700 mb-1 flex items-center gap-2">
                            <i class="bi bi-ui-radios-grid"></i> Cải thiệu siêu tốc Load Danh Sách (1500 cấu hình)
                        </h3>
                        <p
                            class="text-[13px] border-l-2 border-indigo-200 pl-3 py-1 bg-indigo-50/50 rounded-r text-gray-600">
                            Loại bỏ tình trạng đơ/nặng trình duyệt khi nhấn vào hộp tìm kiếm "Loại thống kê". Hệ thống áp dụng <strong>Virtual Scroll Rendering</strong> giúp thao tác xổ xuống cũng như lọc gợi ý nhẹ tựa lông hồng.
                        </p>
                    </div>

                    <div class="bg-white p-4 rounded-lg border border-red-100 shadow-sm relative overflow-hidden">
                        <h3 class="text-[15px] font-bold text-red-600 mb-1 flex items-center gap-2">
                            <i class="bi bi-eye-fill"></i> Hiển thị Popup Thông Minh hơn
                        </h3>
                        <p class="text-[13px] border-l-2 border-red-200 pl-3 py-1 bg-red-50/50 rounded-r text-gray-600">
                            Popup các dãy số bây giờ đã phân tích sâu ngữ cảnh:<br/>
                            1. <strong>Chuỗi đang diễn ra</strong>: Chỉ hiển thị các bộ số có <strong>khả năng xuất hiện</strong> tiếp theo. Giúp thu gọn phán đoán.<br/>
                            2. <strong>Lịch sử Thống Kê</strong>: Liệt kê minh bạch <strong>toàn bộ</strong> mảng số cấu thành định dạng của chuỗi. Cực kỳ dễ hiểu!
                        </p>
                    </div>

                    <div class="bg-white p-4 rounded-lg border border-purple-100 shadow-sm relative overflow-hidden">
                        <h3 class="text-[15px] font-bold text-purple-700 mb-1 flex items-center gap-2">
                            <i class="bi bi-funnel-fill"></i> Chuẩn Hoá Bộ Lọc Tiến Lùi Vô Hình
                        </h3>
                        <p
                            class="text-[13px] border-l-2 border-purple-200 pl-3 py-1 bg-purple-50/50 rounded-r text-gray-600">
                            Khắc phục hoàn toàn lỗi lọt số rác. Với hơn <strong>142 tổ hợp phức tạp</strong> (Đầu Nhỏ Đít Lớn, Tổng Mới...), thuật toán lọc Tiến Lùi/So Le giờ đây tự động quét cả 2 lớp base logic giúp phán đoán đúng 100% con số thoả mãn.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 bg-white border-t border-gray-100 flex justify-end">
                <button id="understandVersionBtn"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2">
                    <i class="bi bi-check2-circle"></i> Xác nhận & Đóng
                </button>
            </div>
        </div>`;

content = content.substring(0, startIdx) + newModalContent + content.substring(endIdx);
fs.writeFileSync('views/statistics.html', content);
console.log('Update popup success!');
