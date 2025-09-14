// services/dataService.js

let lotteryData = null;

// Hàm để lưu dữ liệu vào trung tâm
const setData = (data) => {
    console.log('[DataService] Dữ liệu đã được cập nhật.');
    lotteryData = data;
};

// Hàm để các controller khác lấy dữ liệu ra
const getData = () => {
    return lotteryData;
};

module.exports = {
    setData,
    getData,
};