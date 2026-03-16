const fs = require('fs');
let code = fs.readFileSync('./controllers/suggestionsController.js', 'utf8');

const search = `        // Fallback: Với Về Liên Tiếp, chúng ta mong muốn giữ nguyên giá trị cuối cùng!
        return [extractValue(lastValue, category)];
    }`;

const replace = `        // Về liên tiếp:
        // Các category động (1 đầu, 1 đít, 1 số) cần phải giữ nguyên giá trị cuối
        if (['motDau', 'motDit', 'motSo', 'cacDau', 'cacDit', 'cacSo'].includes(category)) {
             return [extractValue(lastValue, category)];
        }
        // Các category tĩnh (đầu 4 đít lẻ, etc) cho phép mọi số thoả mãn category
        return getNumbersFromCategory(category);
    }`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('./controllers/suggestionsController.js', code);
    console.log('Fixed fallback');
} else {
    console.log('Not found');
}
