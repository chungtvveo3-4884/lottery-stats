const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

// Route để hiển thị trang giao diện thống kê mới
router.get('/', (req, res) => {
    // Gửi file statistics.html từ thư mục views
    res.sendFile('statistics.html', { root: './views' });
});

// API Endpoint chung để lấy tất cả các loại dữ liệu thống kê
// ví dụ: /api/v2/stats?category=motSoVeLienTiep&minLength=3
// ví dụ: /api/v2/stats?category=chanChan&subcategory=veLienTiep
router.get('/api/v2/stats', statisticsController.getStats);
// API Endpoint cho thống kê nhanh khi tải trang
router.get('/api/v2/quick-stats', statisticsController.getQuickStats);

module.exports = router;