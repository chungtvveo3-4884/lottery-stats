const statisticsService = require('../services/statisticsService');

/**
 * Handler chung để lấy dữ liệu thống kê
 */
exports.getStats = async (req, res) => {
    try {
        // Lấy các tham số từ query string của URL
        const { category, subcategory, startDate, endDate, minLength } = req.query;

        if (!category) {
            return res.status(400).json({ message: 'Thiếu tham số "category"' });
        }

        const filters = { startDate, endDate, minLength };
        
        const results = await statisticsService.getFilteredStreaks(category, subcategory, filters);
        
        res.json(results);
    } catch (error) {
        console.error('Lỗi xử lý yêu cầu thống kê:', error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};

// Thêm hàm mới này
exports.getQuickStats = async (req, res) => {
    try {
        const results = await statisticsService.getQuickStats();
        res.json(results);
    } catch (error) {
        console.error('Lỗi khi lấy thống kê nhanh:', error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};