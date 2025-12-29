# Potential Streaks (Chuỗi Có Thể Xảy Ra)

## Tổng quan

Tính năng "Potential Streaks" (Chuỗi Có Thể Xảy Ra) đã được **tích hợp sẵn** vào phần **"Gợi ý loại trừ"** trên trang Statistics.

### Vị trí
- **Frontend**: Hiển thị trong section "Gợi ý loại trừ" (không có UI riêng)
- **Backend**: Logic được xử lý trong `suggestionsController.js`
- **API**: Có endpoint riêng `/api/v2/potential-streaks` cho mục đích testing/debug

### Khi nào hiển thị?
Tính năng chỉ hoạt động khi:
1. ✅ Có ít nhất 1 pattern trong database có **kỷ lục chuỗi = 2 ngày**
2. ✅ Số mới nhất thuộc vào category của pattern đó
3. ✅ Gap statistics đáp ứng điều kiện (lastGap < minGap hoặc lastGap < threshold * avgGap)

### Trạng thái hiện tại
- ❌ **Không có pattern nào có kỷ lục 2 ngày** trong database hiện tại
- ℹ️ Đây là lý do bạn thấy "Tổng patterns có kỷ lục 2 ngày: 0"
- ✅ Logic đã sẵn sàng và sẽ tự động hoạt động khi có dữ liệu phù hợp

## Mục đích

- Tăng số lượng số có thể loại trừ để cải thiện độ chính xác của dự đoán
- Phát hiện sớm các pattern có tiềm năng tạo chuỗi ngắn (2 ngày)
- Cung cấp thêm thông tin để người dùng đánh giá xác suất

## Cách hoạt động

### 1. Thu thập dữ liệu
- Hệ thống quét tất cả các pattern trong database
- Lọc ra các pattern có **kỷ lục chuỗi = 2 ngày**
- Lưu trữ thông tin về gap statistics (minGap, avgGap, lastGap)

### 2. Phân tích số mới nhất
- Xác định số mới nhất từ kết quả xổ số (ví dụ: 12)
- Phân loại số đó thuộc các dạng nào (ví dụ: lẻ chẵn, tổng TT 3, đầu nhỏ đít nhỏ...)
- Kết hợp với các subcategory: veLienTiep, tienLienTiep, luiLienTiep, tienDeuLienTiep, luiDeuLienTiep

### 3. Đánh giá khả năng
Hệ thống đánh giá khả năng đạt kỷ lục dựa trên 2 điều kiện:

#### Điều kiện 1: Khoảng cách ngắn nhất (minGap)
```
if (lastGap < minGap) {
    probability = 'high'
    reason = "Khoảng cách hiện tại < Khoảng cách ngắn nhất"
}
```

#### Điều kiện 2: Ngưỡng trung bình (avgGap)
```
if (lastGap < GAP_THRESHOLD_PERCENT * avgGap) {
    probability = 'medium'
    reason = "Khoảng cách hiện tại < X% TB"
}
```

### 4. Loại trừ số
- Với pattern **veLienTiep**: Loại trừ tất cả số trong category
- Với pattern **tien/lui**: Loại trừ tất cả số trong category (đơn giản hóa)

## API Endpoint

### GET `/statistics/api/v2/potential-streaks`

**Response:**
```json
{
  "success": true,
  "data": {
    "excludedNumbers": [1, 2, 3, ...],
    "count": 10,
    "explanations": [
      {
        "key": "[TIỀM NĂNG] chanLe:veLienTiep",
        "category": "chanLe",
        "subcategory": "veLienTiep",
        "probability": "high",
        "reason": "Khoảng cách hiện tại (5) < Khoảng cách ngắn nhất (10)",
        "numbersCount": 50,
        "numbers": [2, 4, 6, 8, ...]
      }
    ],
    "analysis": {
      "latestNumber": "12",
      "categories": ["chanLe", "tong_tt_3", ...],
      "totalPatternsWithRecord2": 15,
      "potentialStreaks": [...],
      "count": 3
    }
  }
}
```

## Cấu trúc Code

### Services
- **`potentialStreakService.js`**: Service chính xử lý logic
  - `getPatternsWithRecord2Days()`: Lấy danh sách patterns có kỷ lục 2 ngày
  - `analyzePotentialStreaks(latestNumber)`: Phân tích potential streaks
  - `getPotentialStreakExclusions(latestNumber)`: Lấy danh sách số loại trừ

### Controllers
- **`statisticsController.js`**: 
  - `getPotentialStreaks()`: API handler

### Routes
- **`routes/statistics.js`**: 
  - `GET /api/v2/potential-streaks`

### Frontend
- **`public/js/potential-streaks.js`**: Module JavaScript
  - Load và hiển thị potential streaks
  - Tự động refresh khi cần
  - UI components với Tailwind CSS

## Giao diện người dùng

### Vị trí
- **KHÔNG có UI riêng biệt** - đã tích hợp vào phần "Gợi ý loại trừ" 
- Các gợi ý potential streaks có prefix **[TIỀM NĂNG]** để dễ nhận biết
- Hiển thị trong danh sách "Giải thích loại trừ"

### Định dạng
Khi có potential streaks, bạn sẽ thấy các dòng như:
```
[TIỀM NĂNG] chanLe:veLienTiep
Chuỗi tiềm năng: 1 ngày. Kỷ lục: 2 ngày. 
Khoảng cách ngắn nhất cho chuỗi 2 ngày là 10 ngày. 
Khoảng cách hiện tại: 5 ngày < 10 ngày.
```

### Màu sắc
- Sử dụng cùng màu sắc với các gợi ý loại trừ khác
- Không có màu sắc đặc biệt để phân biệt

### Cách kiểm tra
Để kiểm tra xem có potential streaks không:
1. Mở trang `/statistics`
2. Cuộn xuống phần "Gợi ý loại trừ"
3. Tìm các dòng có prefix `[TIỀM NĂNG]`

### Tại sao không thấy?
Nếu không thấy `[TIỀM NĂNG]` nào, có nghĩa là:
- ❌ Không có pattern nào có kỷ lục 2 ngày trong database
- ❌ Hoặc các pattern có kỷ lục 2 ngày không đáp ứng điều kiện gap


## Cấu hình

Sử dụng cùng cấu hình với exclusion logic:
- `STATS_CONFIG.GAP_THRESHOLD_PERCENT`: Ngưỡng % (mặc định 0.3 = 30%)
- `STATS_CONFIG.USE_MIN_GAP`: Có sử dụng minGap không

## Lưu ý quan trọng

### An toàn
- ✅ Không ảnh hưởng đến các chức năng hiện có
- ✅ Sử dụng API riêng biệt
- ✅ Service độc lập
- ✅ Có thể tắt/bật dễ dàng

### Hiệu suất
- Cache được sử dụng từ `statisticsService`
- Chỉ tính toán khi có request
- Không chạy tự động trong background

### Tương lai
- Có thể tích hợp vào `dailyAnalysisService` để tự động loại trừ
- Có thể sử dụng trong `simulationService`
- Có thể thêm vào email notification

## Ví dụ sử dụng

### Trong code
```javascript
const potentialStreakService = require('./services/potentialStreakService');

// Lấy danh sách patterns có kỷ lục 2 ngày
const patterns = await potentialStreakService.getPatternsWithRecord2Days();

// Phân tích số mới nhất
const analysis = await potentialStreakService.analyzePotentialStreaks('12');

// Lấy danh sách số loại trừ
const exclusions = await potentialStreakService.getPotentialStreakExclusions('12');
```

### Trong frontend
```javascript
// Tự động load khi trang được tải
// Hoặc gọi thủ công:
window.PotentialStreaks.load();
```

## Testing

### Manual Test
1. Mở trang `/statistics`
2. Kiểm tra section "Chuỗi Có Thể Xảy Ra"
3. Click nút "Làm mới"
4. Kiểm tra dữ liệu hiển thị

### API Test
```bash
curl http://localhost:3000/statistics/api/v2/potential-streaks
```

## Troubleshooting

### Không có dữ liệu
- Kiểm tra xem có pattern nào có kỷ lục 2 ngày không
- Kiểm tra gap statistics có đầy đủ không
- Xem log trong console

### Lỗi API
- Kiểm tra server đang chạy
- Kiểm tra route đã được đăng ký
- Xem log lỗi trong terminal

### UI không hiển thị
- Kiểm tra script `potential-streaks.js` đã được load
- Mở Developer Tools > Console để xem lỗi
- Kiểm tra element `#potentialStreaksSection` có tồn tại

## Changelog

### Version 1.0.0 (2025-12-02)
- ✅ Tạo service `potentialStreakService.js`
- ✅ Thêm API endpoint `/api/v2/potential-streaks`
- ✅ Tạo UI component trên trang Statistics
- ✅ Tích hợp với hệ thống hiện có
- ✅ Viết documentation
