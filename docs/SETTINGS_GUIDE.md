# Hướng Dẫn Sử Dụng Settings UI

## 📊 Cài Đặt Thống Kê

Trên các trang **Statistics** và **Simulation**, bạn sẽ thấy nút **"⚙️ Cài đặt"** ở góc trên bên phải.

### Các Tham Số Điều Chỉnh

#### 1. **Ngưỡng Gap (%)**
- **Mô tả**: Xác định ngưỡng để phân loại xác suất thấp
- **Công thức**: Xác suất thấp nếu `Cách lần cuối < X% × TB giữa các chuỗi`
- **Slider**: 5% - 30%
- **Giá trị mặc định**: 15%

**Ví dụ**:
- **5% (Nghiêm ngặt)**: Nhiều pattern được đánh giá là "Khó lên X ngày" → Ít pattern "Dễ Tiếp Tục"
- **15% (Cân bằng)**: Mặc định,균형 giữa nghiêm và lỏng
- **30% (Lỏng)**: Ít pattern "Khó lên X ngày" → Nhiều pattern "Dễ Tiếp Tục"

#### 2. **Sử dụng Khoảng cách ngắn nhất**
- **Mô tả**: Có sử dụng minGap trong phân tích
- **Khi bật**: Kiểm tra cả `minGap` VÀ `ngưỡng % TB`
- **Khi tắt**: Chỉ kiểm tra `ngưỡng % TB`

#### 3. **Hiển thị màu nền cho thẻ**
- **Khi bật**: 
  - Thẻ "Đạt kỷ lục": Nền vàng nhạt
  - Thẻ "Khó lên X ngày": Nền đỏ nhạt
  - Thẻ "Dễ Tiếp Tục": Nền trắng
- **Khi tắt**: Tất cả nền trắng

#### 4. **Highlight "Cách lần cuối"**
- **Khi bật**:
  - Màu đỏ (với background): Nếu `Cách lần cuối < minGap` trong thẻ "Khó"
  - Màu xanh (với background): Trong thẻ "Dễ Tiếp Tục"
- **Khi tắt**: Hiển thị số thường

### Cách Sử Dụng

1. **Mở Settings**: Click nút "⚙️ Cài đặt" ở góc trên phải
2. **Điều chỉnh**: Kéo slider hoặc tick checkbox theo ý muốn
3. **Áp dụng**: Click "✓ Áp dụng" → Trang sẽ tự động reload
4. **Khôi phục mặc định**: Click "↻ Mặc định" và xác nhận

### Lưu Trữ

- Cài đặt được lưu vào **localStorage** của browser
- Áp dụng cho cả trang Statistics và Simulation
- Không bị mất khi đóng browser

## 💻 Technical Details

### File Structure
```
public/js/
├── app-config.js        # Config module với localStorage
├── settings-ui.js       # UI component
└── statistics.js        # Sử dụng AppConfig
```

### Config Object
```javascript
AppConfig.current = {
    GAP_THRESHOLD_PERCENT: 0.15,    // 15%
    USE_MIN_GAP: true,              // Kiểm tra minGap
    SHOW_PROBABILITY_BACKGROUNDS: true,
    HIGHLIGHT_LAST_GAP: true
}
```

### API
```javascript
// Get value
const threshold = AppConfig.get('GAP_THRESHOLD_PERCENT');

// Set value
AppConfig.set('GAP_THRESHOLD_PERCENT', 0.20);

// Save multiple
AppConfig.save({ GAP_THRESHOLD_PERCENT: 0.10, USE_MIN_GAP: false });

// Reset to defaults
AppConfig.reset();
```
