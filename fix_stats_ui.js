const fs = require('fs');

async function fix() {
    const file = './public/js/statistics.js';
    let code = fs.readFileSync(file, 'utf8');

    // Mốc cần sửa trong renderCurrentStreaks:
    const search = `<h6 class="\${titleWeight} text-gray-800">\${streak.description}\${superBadge}</h6>`;

    // Thay thế bằng HTML hỗ trợ hiển thị tooltip cho số
    const replace = `
                                        <div class="relative group cursor-pointer" onclick="this.querySelector('.group-hover\\\\:block').classList.toggle('hidden')">
                                            <h6 class="\${titleWeight} text-gray-800 hover:text-indigo-600 transition flex items-center gap-1">
                                                \${streak.description}\${superBadge} <i class="bi bi-info-circle text-xs text-gray-400"></i>
                                            </h6>
                                            \${streak.patternNumbers && streak.patternNumbers.length > 0 ? \`
                                            <div class="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 hidden group-hover:block transition shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                                <p class="text-xs text-gray-400 mb-2 border-b border-gray-700 pb-1">Các số thuộc chuỗi này (\${streak.patternNumbers.length} số):</p>
                                                <div class="flex flex-wrap gap-1">
                                                    \${streak.patternNumbers.map(n => \`<span class="px-1 py-0.5 bg-gray-800 text-gray-200 text-[10px] rounded border border-gray-700">\${String(n).padStart(2, '0')}</span>\`).join('')}
                                                </div>
                                            </div>
                                            \` : ''}
                                        </div>
`;

    if (code.includes(search)) {
        code = code.replace(search, replace);
        fs.writeFileSync(file, code);
        console.log('Fixed statistics.js');
    } else {
        console.log('Could not find search string in statistics.js');
        // Fallback
        const search2 = `<h6 class="\\\${titleWeight} text-gray-800">\\\${streak.description}\\\${superBadge}</h6>`;
        if (code.includes(search2)) {
             code = code.replace(search2, replace);
             fs.writeFileSync(file, code);
             console.log('Fixed statistics.js using search2');
        } else {
             console.log("Still could not find it");
        }
    }
}

fix();
