// app.js (Đã cập nhật và sửa lỗi)

const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { updateJsonFile } = require('./updateData');
const statisticsRoutes = require('./routes/statistics');
const apiRoutes = require('./routes/api');

// ====> THÊM LẠI CÁC SERVICE <====
const lotteryService = require('./services/lotteryService');
const scoringService = require('./services/scoringService');
const statisticsService = require('./services/statisticsService');
const simulationService = require('./services/simulationService');

const app = express();
const port = 6868;

const DATA_FILE = path.join(__dirname, 'data', 'xsmb-2-digits.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// --- API & App Routes ---
app.use('/api', apiRoutes);
app.use('/statistics', statisticsRoutes);

// ====> THÊM LẠI CÁC API ENDPOINT BỊ THIẾU <====
app.get('/api/latest-date', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const lotteryData = JSON.parse(data);
        if (lotteryData.length > 0) {
            const lastEntry = lotteryData[lotteryData.length - 1];
            const date = new Date(lastEntry.date);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            res.json({ latestDate: formattedDate });
        } else {
            res.json({ latestDate: 'Không có dữ liệu' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi đọc dữ liệu' });
    }
});

app.post('/api/update-data', async (req, res) => {
    console.log('Nhận được yêu cầu cập nhật dữ liệu thủ công...');
    try {
        const success = await updateJsonFile();
        if (success) {
            res.status(200).json({ message: 'Dữ liệu đã được cập nhật thành công!' });
        } else {
            res.status(500).json({ message: 'Cập nhật dữ liệu thất bại hoặc không có dữ liệu mới.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Đã xảy ra lỗi nghiêm trọng trong quá trình cập nhật.' });
    }
});
// ====> KẾT THÚC PHẦN THÊM MỚI <====

app.get('/', (req, res) => res.redirect('/statistics'));

app.get('/scoring', async (req, res) => {
    try {
        const scoringData = await scoringService.getScoringStats();
        res.render('scoring-form.html', {
            scoringData: scoringData || {}
        });
    } catch (error) {
        console.error('Lỗi khi render trang scoring:', error);
        res.status(500).send("Đã xảy ra lỗi khi tải trang tính điểm.");
    }
});

app.get('/simulation', (req, res) => {
    res.render('simulation.html');
});


// --- KHỞI ĐỘNG SERVER VÀ LÊN LỊCH TÁC VỤ ---
const startServer = async () => {
    try {
        console.log('--- Khởi động server: Cập nhật dữ liệu và nạp cache lần đầu ---');
        // Chờ cho việc cập nhật và nạp cache lần đầu hoàn tất
        await updateJsonFile(); 

        app.listen(port, () => {
            console.log(`✅ Server đang chạy trên http://localhost:${port}`);
        });

        // Lên lịch tác vụ sau khi server đã chạy
        cron.schedule('45 6,18 * * *', async () => {
            console.log('--- [CRON JOB] Bắt đầu tác vụ cập nhật dữ liệu hàng ngày ---');
            await updateJsonFile();
        }, {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh"
        });
        console.log('✅ Tác vụ cập nhật dữ liệu hàng ngày đã được lên lịch.');

    } catch (error) {
        console.error('❌ Lỗi nghiêm trọng khi khởi động server:', error);
        process.exit(1);
    }
};

startServer();