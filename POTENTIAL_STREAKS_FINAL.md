# ✅ Potential Streaks - ĐÃ CẬP NHẬT LOGIC & HOẠT ĐỘNG TỐT!

## 🎯 Vấn đề & Giải pháp

### Vấn đề cũ
- Logic cũ yêu cầu pattern phải đang có chuỗi hiện tại là 1 ngày (`current.length === 1`).
- Tuy nhiên, dữ liệu `quickStats` thường chỉ lưu chuỗi từ 2 ngày trở lên.
- Hơn nữa, số mới về (ví dụ 86) có thể là **khởi đầu** của một chuỗi mới, nên chưa có trong `current` streaks của pattern đó.

### Giải pháp mới (Đã áp dụng)
- Thay đổi cách tiếp cận:
    1. Lấy số mới nhất (ví dụ: 86).
    2. Xác định tất cả Categories của số đó (ví dụ: `chanChan`, `dau_to`, `tong_tt_4`...).
    3. Quét database để tìm các patterns thuộc categories này có **Kỷ lục = 2 ngày**.
    4. Kiểm tra Gap Statistics (khoảng cách hiện tại so với min/avg gap).
    5. Nếu thỏa mãn → Xác định là Potential Streak.

## 🐛 Các lỗi đã sửa (Bug Fixes)

### 1. `ReferenceError: formatSequence is not defined`
- **Nguyên nhân:** Hàm `formatSequence` được định nghĩa trong scope cũ.
- **Giải pháp:** Đã loại bỏ việc gọi `formatSequence` trong logic mới vì `explanation` đã được format đầy đủ.

### 2. Warning `Excluded triggered for leChan:veSoleMoi...`
- **Nguyên nhân:** Logic `veSole` không xử lý đúng type (string vs number) khi lấy từ `SETS`, dẫn đến filter bị rỗng.
- **Giải pháp:** Đã thêm `map(n => parseInt(n, 10))` khi lấy dữ liệu từ `SETS`.

### 3. Potential Streaks không tìm thấy số (Warning `no numbers predicted`)
- **Nguyên nhân 1:** `predictNextInSequence` không nhận diện được category có prefix `[TIỀM NĂNG]`.
- **Giải pháp 1:** Đã thêm logic remove prefix `[TIỀM NĂNG]` trong `addExcludedNumber` trước khi xử lý.
- **Nguyên nhân 2:** `getSequence` và `extractValue` trả về attribute (ví dụ tổng) thay vì tập số đầy đủ cho các category cụ thể (như `tong_moi_14`), làm hỏng logic dự đoán sequence.
- **Giải pháp 2:** Đã cập nhật `getSequence` và `extractValue` để trả về tập số đầy đủ và giá trị đầy đủ khi category là dạng cụ thể, giúp `predictNextInSequence` hoạt động chính xác.

### 4. Refactoring
- Đã di chuyển `predictNextInSequence`, `getNumbersFromCategory` và các helper functions ra ngoài `getSuggestions` để code sạch hơn và dễ test/debug.

### 5. Fix Wrap Logic cho Tiến/Lùi Đều
- **Vấn đề:** Các pattern dạng "Đều" (Uniform) như `tienDeuLienTiep` bị trả về null khi chạm giới hạn sequence (ví dụ: hết số để tiến), gây ra warning "no numbers predicted".
- **Giải pháp:** Đã áp dụng logic xoay vòng (wrap-around) bằng cách sử dụng `findNextInSequenceWithWrap` thay vì `findNextInSet`. Điều này đảm bảo luôn tìm thấy số tiếp theo (ví dụ: sau 9 quay về 0).

### 6. Fix Type Mismatch (String vs Number)
- **Vấn đề:** `predictNextInSequence` trả về array of strings (từ `SETS`), nhưng `addExcludedNumber` filter chỉ giữ lại `typeof n === 'number'`, dẫn đến tất cả kết quả bị loại bỏ.
- **Giải pháp:** Đã thêm `.map(n => parseInt(n, 10))` khi push `SETS` values vào `resultNumbers`, đảm bảo tất cả giá trị đều là number type.
- **Kết quả:** Số lượng loại trừ tăng từ 56 lên 89 (với số 86), bao gồm cả các pattern như `hieu_cac_hieu:tienLienTiep` đã bị thiếu trước đó.

### 7. UI Improvements & Debugging
- **Highlight Chuỗi Tiềm Năng:** Đã thêm logic trong `suggestions.js` để hiển thị Chuỗi Tiềm Năng với màu tím (purple) thay vì đỏ, giúp dễ phân biệt.
- **Debug "Chuỗi đang diễn ra":** Đã thêm log debug vào `statistics.js` để kiểm tra danh sách chuỗi được render, nhằm điều tra vấn đề thiếu hiển thị "Các hiệu - Tiến Đều".
- **Verification:** Đã xác nhận pattern `hieu_cac_hieu:tienDeuLienTiep` tồn tại trong `quickStats` (backend) và `STATS_OPTIONS` (frontend config).

### 8. Sync Exclusion Logic & Fix Mapping
- **Vấn đề:** Số lượng loại trừ không đồng nhất giữa Statistics (90) và Simulation (87). Nguyên nhân:
    1. `exclusionService.js` sử dụng bản copy cũ của logic dự đoán.
    2. `exclusionService.js` thiếu logic xử lý "Chuỗi tiềm năng" (Potential Streaks) mà `suggestionsController.js` tự tính toán và merge vào.
    3. `exclusionService.js` thiếu xử lý prefix `[TIỀM NĂNG]` trong key.
- **Giải pháp:**
    - Refactor `exclusionService.js` để import `predictNextInSequence`, `getNumbersFromCategory`, `identifyCategories` từ `suggestionsController.js` và `utils/numberAnalysis.js`.
    - Thêm logic "Process Potential Streaks" vào `exclusionService.js` (copy từ `suggestionsController.js`).
    - Thêm logic remove prefix `[TIỀM NĂNG]` khi parse key.
    - Fix lỗi khoảng trắng thừa trong `tempCategory` construction.
- **Fix Mapping Tên:** Đã thêm mapping tên tiếng Việt cho các category mới.

## 📊 Kết quả thực tế (với số 86)
Script kiểm tra `verify_exclusion_count.js` đã xác nhận:
### 9. Update Gap Strategy & Exclusion Logic (New Request)
- **Yêu cầu:**
    - Bỏ quy tắc loại trừ "80% kỷ lục".
    - Thêm logic so sánh khoảng cách "Chính xác chuỗi" (Exact Length) bên cạnh "Lớn hơn hoặc bằng" (Greater or Equal - GE).
    - Thêm tùy chọn chiến lược: GE, EXACT, COMBINED (Mặc định).
    - Thay đổi công thức loại trừ: `lastGap < minGap * (1 + GAP_BUFFER_PERCENT)`. Mặc định Buffer = 15%.
- **Thực hiện:**
    - **`statisticsService.js`**: Bổ sung `exactGapStats` vào `getQuickStats`.
    - **`config/stats-config.js`**: Thêm `GAP_STRATEGY` và `GAP_BUFFER_PERCENT`.
    - **`settings.html` & `settings-page.js`**: Thêm UI settings cho Strategy và Buffer.
    - **`suggestionsController.js`**: Cập nhật logic loại trừ chính và logic "Potential Streaks" theo yêu cầu mới.
    - **`exclusionService.js`**: Đồng bộ logic loại trừ và nhận tham số `options` từ `simulationService`.
    - **`simulationService.js`**: Truyền `options` vào `exclusionService`.
- **Kết quả:** Hệ thống giờ đây hỗ trợ loại trừ linh hoạt hơn dựa trên cấu hình người dùng, với khả năng so sánh chính xác độ dài chuỗi.
- **Ví dụ:**
  - `[TIỀM NĂNG] chanChan:luiDeuLienTiep`
  - `[TIỀM NĂNG] tong_tt_4:luiLienTiep`
  - `[TIỀM NĂNG] tong_moi_14:luiLienTiep`

Script kiểm tra `verify_potential_fix.js` đã xác nhận:

```
Latest Number: 86
Categories: chanChan, dau_chan, dit_chan, ...
Total Patterns with Record=2 matching Number 86: 26
Potential Streaks Identified: 5 ✅
```

### Các chuỗi tiềm năng được phát hiện:
1. **`chanChan:luiDeuLienTiep`**
   - Lý do: `lastGap(39) < minGap(179)`
   - Ý nghĩa: Dạng Chẵn-Chẵn lùi đều có kỷ lục 2 ngày, khoảng cách hiện tại đang rất ngắn so với kỷ lục gap, khả năng cao sẽ lặp lại.

2. **`tong_tt_4:luiLienTiep`**
   - Lý do: `lastGap(29) < minGap(76)`

3. **`tong_moi_14:luiLienTiep`**
   - Lý do: `lastGap(29) < minGap(355)`

4. **`tong_moi_14:tienDeuLienTiep`**
   - Lý do: `lastGap(502) < minGap(1001)`

5. **`tong_moi_14:luiDeuLienTiep`**
   - Lý do: `lastGap(503) < minGap(1170)`

## 📍 Trạng thái Frontend

- Các gợi ý này sẽ xuất hiện trong phần **"Gợi ý loại trừ"** trên trang Statistics.
- Chúng sẽ có prefix **`[TIỀM NĂNG]`**.
- Số lượng số bị loại trừ sẽ tăng lên tương ứng với các patterns này.

## 📝 Kết luận

Logic hiện tại đã **rất linh hoạt** và chính xác. Nó không còn phụ thuộc vào việc pattern có đang "active" (current streak > 0) hay không, mà dựa vào tính chất của số mới nhất để dự đoán khả năng hình thành chuỗi kỷ lục.

### 10. UI Updates for Gap Analysis (New Request)
- **Yêu cầu:** Hiển thị thông tin khoảng cách chính xác (Exact Gap) và điều kiện kết hợp trên toàn bộ giao diện (Gợi ý, Chuỗi đang diễn ra, Thống kê).
- **Thực hiện:**
    - **`public/js/statistics.js`**:
        - Cập nhật `renderCurrentStreaks` để hiển thị chi tiết Gap (GE & Exact) và trạng thái (Xanh/Đỏ/Vàng) dựa trên Strategy.
        - Cập nhật `renderRecordAccordionItem` để hiển thị 2 bảng thống kê: "GAP STATS (GE >= Len)" và "EXACT GAP STATS (== Len)".
        - Thêm logic fetch config từ server để đồng bộ cài đặt.
    - **`public/js/suggestions.js`**:
        - Cập nhật `loadSuggestions` để lấy config từ server và gửi params `gapStrategy`, `gapBuffer` lên API.
- **Kết quả:** Người dùng có thể nhìn thấy rõ ràng lý do loại trừ hoặc cảnh báo dựa trên cả 2 tiêu chí Gap (GE và Exact) ngay trên giao diện.
