const fs = require('fs');

async function fix() {
    const file = './services/statisticsService.js';
    let code = fs.readFileSync(file, 'utf8');

    const searchOld = `        // [MỚI] Dùng logic predictNextInSequence để lấy pattern numbers chuẩn
        if (current) {
            try {
                const { predictNextInSequence } = require('../controllers/suggestionsController');
                const [categoryName, subcategoryStr] = key.split(':');
                const statObj = { current: current };
                const nums = predictNextInSequence(statObj, categoryName, subcategoryStr || '');
                if (nums && nums.length > 0) {
                    current.patternNumbers = nums;
                }
            } catch (e) {
                console.error('Lỗi khi lấy danh sách số cho pattern', key, e);
            }
        }`;

    const searchNewPos = `                        }
                    }
                }
            }
        }
    };

    for (const key in allStats) {`;

    const replaceNewPos = `                        }
                    }
                }
            }
        }

        // [MỚI] Dùng logic predictNextInSequence để lấy pattern numbers chuẩn (chạy sau khi mọi current đã hình thành)
        if (quickStats[key] && quickStats[key].current) {
            try {
                const { predictNextInSequence } = require('../controllers/suggestionsController');
                const [categoryName, subcategoryStr] = key.split(':');
                const statObj = { current: quickStats[key].current };
                const nums = predictNextInSequence(statObj, categoryName, subcategoryStr || '');
                if (nums && nums.length > 0) {
                    quickStats[key].current.patternNumbers = nums;
                }
            } catch (e) {
                console.error('Lỗi khi lấy danh sách số cho pattern', key, e);
            }
        }

    };

    for (const key in allStats) {`;

    if (code.includes(searchOld)) {
        code = code.replace(searchOld, '');
        code = code.replace(searchNewPos, replaceNewPos);
        console.log('Moved patternNumbers generation down');
        fs.writeFileSync(file, code);
    } else {
        console.log('Could not find search block');
    }
}

fix();
