const { getTongTT, getTongMoi, getHieu } = require('./lotteryUtils'); // Giả sử file này tồn tại hoặc tôi sẽ tạo nó

function getNumbersForCategory(category, subcategory, streakValue) {
    const numbers = [];

    // 1. Xử lý các trường hợp cụ thể dựa trên streakValue (nếu có)
    // Ví dụ: Nếu streakValue là "05", thì số là [05]
    if (streakValue) {
        if (Array.isArray(streakValue)) {
            return streakValue.map(v => parseInt(v));
        }
        if (!isNaN(parseInt(streakValue))) {
            return [parseInt(streakValue)];
        }
    }

    // 2. Xử lý dựa trên category/subcategory nếu streakValue không cụ thể
    // (Logic này phức tạp hơn vì cần generate số từ 00-99)
    for (let i = 0; i < 100; i++) {
        const numStr = i.toString().padStart(2, '0');
        const dau = parseInt(numStr[0]);
        const dit = parseInt(numStr[1]);

        let match = false;

        if (category.startsWith('dau_') && !category.includes('dit')) {
            const targetDau = parseInt(category.split('_')[1]);
            if (dau === targetDau) match = true;
        } else if (category.startsWith('dit_') && !category.includes('dau')) {
            const targetDit = parseInt(category.split('_')[1]);
            if (dit === targetDit) match = true;
        } else if (category.startsWith('tong_tt_')) {
            const targetTong = parseInt(category.replace('tong_tt_', ''));
            if (getTongTT(numStr) === targetTong) match = true;
        } else if (category.startsWith('tong_moi_')) {
            const targetTong = parseInt(category.replace('tong_moi_', ''));
            if (getTongMoi(numStr) === targetTong) match = true;
        } else if (category.startsWith('hieu_')) {
            const targetHieu = parseInt(category.replace('hieu_', ''));
            if (getHieu(numStr) === targetHieu) match = true;
        }
        // ... Thêm các logic khác (chẵn lẻ, đầu to đít nhỏ...) nếu cần

        if (match) numbers.push(i);
    }

    return numbers;
}

module.exports = { getNumbersForCategory };
