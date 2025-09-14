// updateData.js (Phiên bản cập nhật từ GitHub)
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DATA_FILE = path.join(__dirname, 'data', 'xsmb-2-digits.json');
// --- 1. THAY ĐỔI URL API ---
const API_URL = 'https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/refs/heads/main/data/xsmb-2-digits.json';

const updateJsonFile = async () => {
    console.log(`[DATA UPDATE] Bắt đầu lấy dữ liệu từ GitHub: ${API_URL}...`);
    try {
        const response = await axios.get(API_URL);
        
        // --- 2. ĐƠN GIẢN HÓA LOGIC XỬ LÝ ---
        // Dữ liệu từ GitHub đã là một mảng JSON, không cần phải xử lý Object.entries nữa
        const githubData = response.data;

        // Kiểm tra xem dữ liệu có phải là một mảng và có nội dung không
        if (githubData && Array.isArray(githubData) && githubData.length > 0) {
            
            // Sắp xếp lại để đảm bảo dữ liệu luôn đúng thứ tự thời gian
            githubData.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Ghi file
            fs.writeFileSync(DATA_FILE, JSON.stringify(githubData, null, 2), 'utf8');
            console.log(`[DATA UPDATE] Đã cập nhật file ${DATA_FILE} thành công từ GitHub.`);
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