const statisticsService = require('../services/statisticsService');

/**
 * Handler chung để lấy dữ liệu thống kê theo bộ lọc
 */
exports.getStats = async (req, res) => {
    try {
        const { category, subcategory, startDate, endDate, exactLength } = req.query;

        if (!category) {
            return res.status(400).json({ message: 'Thiếu tham số "category"' });
        }
        
        const filters = { startDate, endDate, exactLength };
        
        const results = await statisticsService.getFilteredStreaks(category, subcategory, filters);
        
        res.json(results);
    } catch (error) {
        console.error('Lỗi xử lý yêu cầu thống kê:', error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};

/**
 * Handler để lấy dữ liệu cho phần "Thống kê nhanh"
 */
exports.getQuickStats = async (req, res) => {
    try {
        const results = await statisticsService.getQuickStats();
        res.json(results);
    } catch (error) { // SỬA LỖI: Thêm dấu ngoặc nhọn {}
        console.error('Lỗi khi lấy thống kê nhanh:', error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};