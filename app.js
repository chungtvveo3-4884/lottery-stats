const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const { updateJsonFile } = require('./updateData');
const app = express();
const port = 6868;

// Đường dẫn đến file dữ liệu
const DATA_FILE = path.join(__dirname, 'data', 'xsmb-2-digits.json');

// Biến toàn cục để lưu trữ dữ liệu
let lotteryData = null;

// THÊM BODY PARSER MIDDLEWARE Ở ĐÂY
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- HÀM MỚI ĐỂ NẠP DỮ LIỆU VÀO CACHE ---
const loadDataToCache = () => {
    try {
        console.log('[CACHE] Đang nạp dữ liệu từ file vào bộ nhớ...');
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        lotteryData = JSON.parse(data);
        console.log(`[CACHE] Đã nạp thành công ${lotteryData.length} bản ghi vào bộ nhớ.`);
    } catch (err) {
        console.error('[CACHE] Lỗi khi nạp dữ liệu vào bộ nhớ:', err);
        lotteryData = []; // Đặt là mảng rỗng nếu có lỗi để tránh crash
    }
};

// --- CẤU HÌNH CRON JOB ĐÃ ĐƯỢC NÂNG CẤP ---
// Gộp 2 lịch trình làm 1 (chạy lúc 7h và 19h) và dùng async/await
cron.schedule('0 7,19 * * *', async () => {
    console.log(`[CRON] Bắt đầu lịch trình cập nhật file lúc ${new Date().toLocaleTimeString('vi-VN')}`);
    try {
        const success = await updateJsonFile();
        if (success) {
            console.log('[CRON] Cập nhật file thành công. Bắt đầu làm mới dữ liệu trong cache...');
            // Sau khi cập nhật file thành công, nạp lại dữ liệu vào bộ nhớ
            loadDataToCache();
        } else {
            console.log('[CRON] Cập nhật file thất bại, không có dữ liệu mới.');
        }
    } catch (error) {
        console.error('[CRON] Lỗi nghiêm trọng trong quá trình chạy cron job:', error);
    }
}, {
    timezone: 'Asia/Ho_Chi_Minh'
});


// Middleware để đọc dữ liệu và lưu vào biến toàn cục
app.use((req, res, next) => {
    // Nếu dữ liệu chưa được tải HOẶC dữ liệu đã được tải nhưng rỗng, thì tải lại
    if (!lotteryData || lotteryData.length === 0) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            lotteryData = JSON.parse(data);
            console.log('Dữ liệu xổ số đã được tải vào bộ nhớ.');
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu xổ số:', err);
            lotteryData = null; // Đảm bảo nó là null nếu có lỗi
        }
    }
    req.lotteryData = lotteryData; // Gán dữ liệu vào req
    next();
});

// Cấu hình Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/update-data', async (req, res) => {
    console.log('Nhận được yêu cầu cập nhật dữ liệu thủ công...');
    try {
        const success = await updateJsonFile(); // Gọi hàm cập nhật bạn đã có
        if (success) {
            // Quan trọng: Xóa cache dữ liệu cũ để middleware có thể nạp lại file mới ở lần truy cập sau
            lotteryData = null; 
            res.json({ success: true, message: 'Dữ liệu đã được cập nhật.' });
        } else {
            res.status(500).json({ success: false, message: 'Cập nhật dữ liệu thất bại từ API.' });
        }
    } catch (error) {
         console.error('Lỗi khi thực thi update-data API:', error);
         res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật dữ liệu.' });
    }
});

app.get('/api/last-update-date', (req, res) => {
    try {
        const stats = fs.statSync(DATA_FILE);
        res.json({ lastUpdateDate: stats.mtime }); // mtime là thời gian sửa đổi cuối cùng của file
    } catch (error) {
        console.error('Không thể lấy thông tin file dữ liệu:', error);
        res.status(500).json({ lastUpdateDate: null });
    }
});

// ================================================================
// CÁC ROUTER HIỆN CÓ CỦA BẠN (GIỮ NGUYÊN NHƯ FILE app.js CỦA BẠN ĐÃ CUNG CẤP)
// Đảm bảo import đầy đủ các router này
// ================================================================

// Import các router hiện có của bạn (ĐẢM BẢO CÁC FILE NÀY TỒN TẠI VÀ CHÍNH XÁC)
const indexRouter = require('./routes/index');
const consecutivePairsRouter = require('./routes/consecutivePairs'); // Ví dụ
const consecutiveHeadsRouter = require('./routes/consecutiveHeads'); // Ví dụ
const consecutiveTailsRouter = require('./routes/consecutiveTails'); // Ví dụ
const alternatingNumberPairsRouter = require('./routes/alternatingNumberPairs');
const alternatingHeadsRouter = require('./routes/alternatingHeads');
const alternatingTailsRouter = require('./routes/alternatingTails');
const parityHeadTailSequencesRouter = require('./routes/parityHeadTailSequences');
const consecutiveDoubleNumbersRouter = require('./routes/consecutiveDoubleNumbers');
const consecutiveOffsetDoubleNumbersRouter = require('./routes/consecutiveOffsetDoubleNumbers');
const paritySequenceNumbersRouter = require('./routes/paritySequenceNumbers');
const evenHeadsGreaterThan4Router = require('./routes/evenHeadsGreaterThan4');
const evenHeadsLessThan4Router = require('./routes/evenHeadsLessThan4');
const evenTailsGreaterThan4Router = require('./routes/evenTailsGreaterThan4');
const evenTailsLessThan4Router = require('./routes/evenTailsLessThan4');
const oddHeadsGreaterThan5Router = require('./routes/oddHeadsGreaterThan5');
const oddHeadsLessThan5Router = require('./routes/oddHeadsLessThan5');
const oddTailsGreaterThan5Router = require('./routes/oddTailsGreaterThan5');
const oddTailsLessThan5Router = require('./routes/oddTailsLessThan5');
const headAndTailStatsRouter = require('./routes/headAndTailStats');
const consecutiveSumRouter = require('./routes/consecutiveSum');
const increasingHeadsRouter = require('./routes/increasingHeads');
const decreasingHeadsRouter = require('./routes/decreasingHeads');
const increasingTailsRouter = require('./routes/increasingTails');
const decreasingTailsRouter = require('./routes/decreasingTails');
const consecutiveIncreasingNumbersRouter = require('./routes/consecutiveIncreasingNumbers');
const consecutiveDecreasingNumbersRouter = require('./routes/consecutiveDecreasingNumbers');
const soleSumSequences = require('./routes/soleSumSequences');
const specificSumRangeSequences = require('./routes/specificSumRangeSequences');
const traditionalSumRangeSequences = require('./routes/traditionalSumRangeSequences');
const scoringRoutes = require('./routes/scoringRoutes'); // Đổi tên thành scoringRoutes cho rõ ràng
const newSumSolePairs = require('./routes/newSumSolePairs');
const simulationRoutes = require('./routes/simulation');
const absenceStreaksRouter = require('./routes/absenceStreaks');
const predictionRouter = require('./routes/prediction');
const advancedSequencesRouter = require('./routes/advancedSequences'); 
const headTailSizeSequencesRouter = require('./routes/headTailSizeSequences'); 
const differenceSequencesRouter = require('./routes/differenceSequences'); 

// Sử dụng các router đã import
app.use('/', indexRouter); // indexRouter sẽ xử lý '/' và '/overall-stats'
app.use('/consecutive-pairs', consecutivePairsRouter);
app.use('/consecutive-heads', consecutiveHeadsRouter);
app.use('/consecutive-tails', consecutiveTailsRouter);
app.use('/alternating-number-pairs', alternatingNumberPairsRouter);
app.use('/alternating-heads', alternatingHeadsRouter);
app.use('/alternating-tails', alternatingTailsRouter);
app.use('/parity-head-tail-sequences', parityHeadTailSequencesRouter);
app.use('/consecutive-double-numbers', consecutiveDoubleNumbersRouter);
app.use('/consecutive-offset-double-numbers', consecutiveOffsetDoubleNumbersRouter);
app.use('/parity-sequence-numbers', paritySequenceNumbersRouter);
app.use('/even-heads-greater-than-4', evenHeadsGreaterThan4Router);
app.use('/even-heads-less-than-4', evenHeadsLessThan4Router);
app.use('/even-tails-greater-than-4', evenTailsGreaterThan4Router);
app.use('/even-tails-less-than-4', evenTailsLessThan4Router);
app.use('/odd-heads-greater-than-5', oddHeadsGreaterThan5Router);
app.use('/odd-heads-less-than-5', oddHeadsLessThan5Router);
app.use('/odd-tails-greater-than-5', oddTailsGreaterThan5Router);
app.use('/odd-tails-less-than-5', oddTailsLessThan5Router);
app.use('/head-and-tail-stats', headAndTailStatsRouter);
app.use('/consecutive-sum', consecutiveSumRouter);
app.use('/increasing-heads', increasingHeadsRouter);
app.use('/decreasing-heads', decreasingHeadsRouter);
app.use('/increasing-tails', increasingTailsRouter);
app.use('/decreasing-tails', decreasingTailsRouter);
app.use('/consecutive-increasing-numbers', consecutiveIncreasingNumbersRouter);
app.use('/consecutive-decreasing-numbers', consecutiveDecreasingNumbersRouter);
app.use('/soleSumSequences', soleSumSequences);
app.use('/specificSumRangeSequences', specificSumRangeSequences);
app.use('/traditionalSumRangeSequences', traditionalSumRangeSequences);
app.use('/scoring', scoringRoutes); // Đảm bảo đúng route
app.use('/new-sum-sole-pairs', newSumSolePairs);
app.use('/simulation', simulationRoutes);
app.use('/absence-streaks', absenceStreaksRouter);
app.use('/prediction', predictionRouter);
app.use('/advanced-sequences', advancedSequencesRouter);
app.use('/head-tail-size-sequences', headTailSizeSequencesRouter);
app.use('/difference-sequences', differenceSequencesRouter); 

// Khởi động server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
    loadDataToCache();
});