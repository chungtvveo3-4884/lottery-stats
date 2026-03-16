const fs = require('fs');

async function fix() {
    const file = './services/historicalExclusionService.js';
    let code = fs.readFileSync(file, 'utf8');

    const search = `        // Tìm chuỗi đang diễn ra tại ngày cần dự đoán
        let current = null;
        if (isSoLePattern) {
            // So le: chuỗi kết thúc ngày hôm qua
            current = historicalStreaks.find(s => s.endDate === prevDateStr);`;

    const replace = `        // Tìm chuỗi đang diễn ra tại ngày cần dự đoán
        let current = null;
        if (isSoLePattern) {
            // So le: chuỗi kết thúc 2 ngày trước (targetDate là ngày khớp pattern)
            // hoặc kết thúc ngày hôm qua (targetDate là ngày xen kẽ)
            const targetDateObj = parseDate(targetDateStr);
            const twoDaysAgo = new Date(targetDateObj);
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const twoDaysAgoStr = \`\${String(twoDaysAgo.getDate()).padStart(2, '0')}/\${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}/\${twoDaysAgo.getFullYear()}\`;

            current = historicalStreaks.find(s => s.endDate === twoDaysAgoStr);
            if (!current) {
                 // Không ép buộc đánh ngày xen kẽ nữa, vì ngày xen kẽ phải khác chuỗi, logic loại trừ sẽ loại chuỗi (đánh theo ngày xen kẽ), điều này là an toàn.
                 current = historicalStreaks.find(s => s.endDate === prevDateStr);
            }`;

    if (code.includes(search)) {
        code = code.replace(search, replace);
        fs.writeFileSync(file, code);
        console.log('Fixed historicalExclusionService.js');
    } else {
        console.log('Could not find search string in historicalExclusionService.js');
    }
}

fix();
