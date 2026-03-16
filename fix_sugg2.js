const fs = require('fs');
let code = fs.readFileSync('./controllers/suggestionsController.js', 'utf8');

// Fix getSequence
const search1 = `        // Các dạng Đầu/Đít cụ thể (dau_le_lon_hon_5, etc.)`;
const replace1 = `        // Trend patterns prefix
        if (cat.startsWith('cacSo')) return Array.from({length: 100}, (_, i) => String(i).padStart(2, '0'));
        if (cat.startsWith('cacDau')) return ['0','1','2','3','4','5','6','7','8','9'];
        if (cat.startsWith('cacDit') && !cat.startsWith('cacDitTien')) return ['0','1','2','3','4','5','6','7','8','9'];
        if (cat.startsWith('cacDit')) return ['0','1','2','3','4','5','6','7','8','9']; // Actually just cacDit

        // Các dạng Đầu/Đít cụ thể (dau_le_lon_hon_5, etc.)`;
code = code.replace(search1, replace1);

// Fix mapping
const search2 = `        // Special cases: cacSo, cacDau, cacDit
        else if (category === 'cacSo') {
            resultNumbers.push(parseInt(nextVal, 10));
        }
        else if (category === 'cacDau') {
            const targetDigit = nextVal;
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => String(n).padStart(2, '0')[0] === targetDigit));
        }
        else if (category === 'cacDit') {
            const targetDigit = nextVal;
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => String(n).padStart(2, '0')[1] === targetDigit));
        }`;

const replace2 = `        // Special cases: cacSo, cacDau, cacDit
        else if (category.startsWith('cacSo')) {
            resultNumbers.push(parseInt(nextVal, 10));
        }
        else if (category.startsWith('cacDau')) {
            const targetDigit = nextVal;
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => String(n).padStart(2, '0')[0] === targetDigit));
        }
        else if (category.startsWith('cacDit')) {
            const targetDigit = nextVal;
            resultNumbers.push(...Array.from({ length: 100 }, (_, i) => i)
                .filter(n => String(n).padStart(2, '0')[1] === targetDigit));
        }`;
code = code.replace(search2, replace2);

// Fix extractValue logic for cacSoTien, etc.
const search3 = `        if (cat === 'cacSo') return strVal; // Full 2-digit number
        if (cat === 'cacDau') return strVal[0]; // Head digit
        if (cat === 'cacDit') return strVal[1]; // Tail digit`;

const replace3 = `        if (cat.startsWith('cacSo')) return strVal; // Full 2-digit number
        if (cat.startsWith('cacDau')) return strVal[0]; // Head digit
        if (cat.startsWith('cacDit')) return strVal[1]; // Tail digit`;
code = code.replace(search3, replace3);

fs.writeFileSync('./controllers/suggestionsController.js', code);
console.log('Fixed suggestionsController again');
