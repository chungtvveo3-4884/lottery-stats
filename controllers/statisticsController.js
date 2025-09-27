const statisticsService = require('../services/statisticsService');
const suggestionService = require('../services/suggestionService'); 

/**
 * Handler chung để lấy dữ liệu thống kê
 */
exports.getStats = async (req, res) => {
    try {
        // Lấy các tham số từ query string của URL
        // SỬA LỖI: Đổi tên 'minLength' thành 'exactLength' để khớp với yêu cầu từ client (HTML)
        const { category, subcategory, startDate, endDate, exactLength } = req.query;

        if (!category) {
            return res.status(400).json({ message: 'Thiếu tham số "category"' });
        }

        // Truyền đúng tham số 'exactLength' vào bộ lọc
        const filters = { startDate, endDate, minLength: exactLength };
        
        const results = await statisticsService.getFilteredStreaks(category, subcategory, filters);
        
        res.json(results);
    } catch (error) {
        console.error('Lỗi xử lý yêu cầu thống kê:', error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};

/**
 * Handler để lấy dữ liệu cho phần "Thống kê kỷ lục"
 */
exports.getQuickStats = async (req, res) => {
    try {
        const results = await statisticsService.getQuickStats();
        res.json(results);
    } catch (error) {
        console.error('Lỗi khi lấy thống kê nhanh:', error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        // Chỉ cần lấy chuỗi nóng và thống kê tổng thể
        const recentStreaks = await statisticsService.getRecentStreaks();
        const overallStats = await statisticsService.getQuickStats();
        
        const suggestions = await suggestionService.generateSuggestions(recentStreaks, overallStats);
        res.json(suggestions);
    } catch (error) {
        console.error('Lỗi khi tạo gợi ý:', error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ khi tạo gợi ý" });
    }
};