// updateData.js (Phiên bản đã sửa lỗi)
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const generateNumberStats = require('./services/statisticsGenerator');
const generateHeadTailStats = require('./services/headTailStatsGenerator');
const generateSumDifferenceStats = require('./services/sumDifferenceStatsGenerator'); 

const DATA_FILE = path.join(__dirname, 'data', 'xsmb-2-digits.json');
// URL API để lấy dữ liệu mới nhất
const API_URL = 'https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/refs/heads/main/data/xsmb-2-digits.json';

const updateJsonFile = async () => {
    console.log(`[DATA UPDATE] Bắt đầu lấy dữ liệu từ GitHub: ${API_URL}...`);
    try {
        const response = await axios.get(API_URL);
        const githubData = response.data;

        // Kiểm tra dữ liệu hợp lệ
        if (githubData && Array.isArray(githubData) && githubData.length > 0) {
            
            // Sắp xếp lại để đảm bảo dữ liệu luôn đúng thứ tự thời gian
            githubData.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Ghi file
            fs.writeFileSync(DATA_FILE, JSON.stringify(githubData, null, 2), 'utf8');
            console.log(`[DATA UPDATE] Đã cập nhật file ${DATA_FILE} thành công từ GitHub.`);
            
            // Chạy lại tất cả các tiến trình tạo thống kê
            Promise.all([
                generateNumberStats(),
                generateHeadTailStats(),
                generateSumDifferenceStats()
            ]).then(() => {
                console.log('Tất cả các file thống kê đã được tạo lại thành công!');
            }).catch(err => {
                console.error('Đã xảy ra lỗi trong quá trình tạo lại file thống kê:', err);
            });
            return true; 

        } else {
            console.log('[DATA UPDATE] Không nhận được dữ liệu hợp lệ từ GitHub.');
            return false; 
        }
    } catch (error) {
        console.error(`[DATA UPDATE] Lỗi khi cập nhật file dữ liệu từ GitHub:`, error.message);
        return false;
    }
};

module.exports = { updateJsonFile };