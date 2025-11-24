/**
 * Statistics Configuration
 * Điều chỉnh các tham số này để thay đổi logic phân tích thống kê
 */

const STATS_CONFIG = {
    /**
     * Ngưỡng gap để xác định xác suất thấp
     * Nếu lastGap < (GAP_THRESHOLD_PERCENT * avgGap), coi là xác suất thấp
     * Giá trị mặc định: 0.15 (15%)
     * 
     * Ví dụ:
     * - 0.10 (10%): Nghiêm ngặt hơn, nhiều pattern sẽ được đánh giá là "khó"
     * - 0.15 (15%): Cân bằng (mặc định)
     * - 0.20 (20%): Lỏng hơn, ít pattern được đánh giá là "khó"
     */
    GAP_THRESHOLD_PERCENT: 0.15,

    /**
     * Có sử dụng minGap trong logic xác định xác suất thấp
     * Nếu true: Kiểm tra cả minGap và avgGap threshold
     * Nếu false: Chỉ kiểm tra avgGap threshold
     */
    USE_MIN_GAP: true,

    /**
     * UI Display Settings
     */
    UI: {
        // Hiển thị background màu cho thẻ dựa trên probability
        SHOW_PROBABILITY_BACKGROUNDS: true,

        // Highlight số "Cách lần cuối"
        HIGHLIGHT_LAST_GAP: true,

        // Số ngày tối thiểu để hiển thị cảnh báo
        MIN_STREAK_LENGTH_FOR_WARNING: 2
    }
};

// Export cho cả Node.js và browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = STATS_CONFIG;
}
