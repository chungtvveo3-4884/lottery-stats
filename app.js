// app.js (Đã cập nhật)

const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { updateJsonFile } = require('./updateData'); 
const statisticsRoutes = require('./routes/statistics');
const scoringService = require('./services/scoringService'); // <-- THÊM DÒNG NÀY
const apiRoutes = require('./routes/api'); // <-- THÊM DÒNG NÀY (nếu chưa có)

const app = express();
const port = 6868;

const DATA_FILE = path.join(__dirname, 'data', 'xsmb-2-digits.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // Hoặc bất kỳ view engine nào bạn đang dùng

// --- API ROUTES ---
app.use('/api', apiRoutes);
// API để lấy ngày cập nhật cuối cùng của dữ liệu
app.get('/api/latest-date', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const lotteryData = JSON.parse(data);
        if (lotteryData.length > 0) {
            // Lấy ngày của bản ghi cuối cùng
            const lastEntry = lotteryData[lotteryData.length - 1];
            const date = new Date(lastEntry.date);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            res.json({ latestDate: formattedDate });
        } else {
            res.json({ latestDate: 'Không có dữ liệu' });
        }
    } catch (error) {
        console.error('Lỗi khi đọc file dữ liệu:', error);
        res.status(500).json({ message: 'Lỗi khi đọc dữ liệu' });
    }
});

// API để kích hoạt cập nhật dữ liệu thủ công
app.post('/api/update-data', async (req, res) => {
    console.log('Nhận được yêu cầu cập nhật dữ liệu thủ công...');
    try {
        const success = await updateJsonFile();
        if (success) {
            res.status(200).json({ message: 'Dữ liệu đã được cập nhật thành công! Trang sẽ được tải lại.' });
        } else {
            res.status(500).json({ message: 'Cập nhật dữ liệu thất bại.' });
        }
    } catch (error) {
        console.error('Lỗi trong quá trình cập nhật thủ công:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi nghiêm trọng trong quá trình cập nhật.' });
    }
});


// --- ROUTES CỦA ỨNG DỤNG ---

// Route cho trang thống kê V2
app.use('/statistics', statisticsRoutes); 

// Route cho các trang khác
app.get('/', (req, res) => {
    res.redirect('/statistics'); // Chuyển hướng trang chủ đến trang thống kê mới
});

// [ĐÃ CẬP NHẬT] - Route cho trang scoring giờ sẽ truyền dữ liệu
app.get('/scoring', (req, res) => {
    // Lấy dữ liệu đã được cache từ scoringService
    const scoringData = scoringService.getScoringStats();

    // Render trang 'scoring.html' và truyền toàn bộ object data vào
    res.render('scoring', {
        scoringData: scoringData || {} // Truyền object rỗng nếu data chưa có
    });
});

app.get('/simulation', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'simulation.html'));
});


// Lên lịch chạy vào 2 giờ sáng mỗi ngày để tự động cập nhật
cron.schedule('0 2 * * *', () => {
    console.log('--- Bắt đầu tác vụ cập nhật dữ liệu tự động theo lịch (cron job) ---');
    updateJsonFile();
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
});

app.listen(port, () => {
    console.log(`Ứng dụng đang chạy trên http://localhost:${port}`);
    console.log('✅ Tác vụ cập nhật dữ liệu tự động đã được lên lịch.');
    // Chạy cập nhật một lần khi khởi động để đảm bảo dữ liệu luôn mới nhất
    console.log('--- Chạy cập nhật dữ liệu lần đầu khi khởi động ---');
    updateJsonFile();
});