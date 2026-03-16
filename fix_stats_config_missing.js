const fs = require('fs');

const ht = JSON.parse(fs.readFileSync('./data/statistics/head_tail_stats.json'));
const num = JSON.parse(fs.readFileSync('./data/statistics/number_stats.json'));
const sum = JSON.parse(fs.readFileSync('./data/statistics/sum_difference_stats.json'));

const allStats = { ...ht, ...num, ...sum };

const filePath = './public/js/stats-config.js';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

let inserted = 0;

for (const key in allStats) {
    if (allStats[key] && allStats[key].tienLuiSoLe) {
        // category is `key`
        let lastIndex = -1;
        let hasTienLui = false;
        let hasLuiTien = false;
        let baseText = '';

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`category: "${key}"`)) {
                lastIndex = i;
                if (lines[i].includes('tienLuiSoLe')) hasTienLui = true;
                if (lines[i].includes('luiTienSoLe')) hasLuiTien = true;

                if (!baseText) {
                    const match = lines[i].match(/text:\s*"([^"-]+)[^"]*"/);
                    if (match) {
                        // try to extract just the base prefix
                        let text = match[1].trim();
                        // often we see "text: "Dạng Chẵn-Chẵn - ...""
                        if (text.endsWith(' - Về liên tiếp')) text = text.replace(' - Về liên tiếp', '');
                        if (text.endsWith(' - Tiến liên tiếp')) text = text.replace(' - Tiến liên tiếp', '');
                        if (text.endsWith(' - Về so le')) text = text.replace(' - Về so le', '');
                        baseText = text;
                    }
                }
            }
        }

        if (lastIndex !== -1 && baseText) {
            if (!hasTienLui) {
                // Remove trailing hyphen if it exists
                if (baseText.endsWith('-')) baseText = baseText.substring(0, baseText.length - 1).trim();
                lines.splice(lastIndex + 1, 0, `    { text: "${baseText} - Tiến-Lùi So Le (>=4)", category: "${key}", subcategory: "tienLuiSoLe" },`);
                lastIndex++;
                inserted++;
            }
            if (!hasLuiTien) {
                // Remove trailing hyphen if it exists
                if (baseText.endsWith('-')) baseText = baseText.substring(0, baseText.length - 1).trim();
                lines.splice(lastIndex + 1, 0, `    { text: "${baseText} - Lùi-Tiến So Le (>=4)", category: "${key}", subcategory: "luiTienSoLe" },`);
                lastIndex++;
                inserted++;
            }
        }
    }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Inserted missing for ALL valid categories:', inserted);
