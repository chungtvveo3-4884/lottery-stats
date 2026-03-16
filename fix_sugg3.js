const fs = require('fs');
let code = fs.readFileSync('./controllers/suggestionsController.js', 'utf8');

const search = `        // Fallback: Trả về tất cả số của category
        return getNumbersFromCategory(category);
    }`;

const replace = `        // Fallback: Với Về Liên Tiếp, chúng ta mong muốn giữ nguyên giá trị cuối cùng!
        return [extractValue(lastValue, category)];
    }`;

code = code.replace(search, replace);
fs.writeFileSync('./controllers/suggestionsController.js', code);
console.log('Fixed suggestionsController again');
