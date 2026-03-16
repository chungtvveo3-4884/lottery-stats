const fs = require('fs');
let code = fs.readFileSync('./controllers/suggestionsController.js', 'utf8');

const search = `    const isVeLienTiep = subcategory === 'veLienTiep' || subcategory === 'veCungGiaTri' || category.includes('VeLienTiep'); // Về liên tiếp cùng giá trị`;

const replace = `    const isVeLienTiep = subcategory === 'veLienTiep' || subcategory === 'veCungGiaTri' || category.includes('VeLienTiep'); // Về liên tiếp cùng giá trị
    const isSoLe = subcategory.toLowerCase().includes('sole'); // veSole, veSoleMoi

    if (isSoLe && !subcategory.toLowerCase().includes('tienluisole') && !subcategory.toLowerCase().includes('luitiensole')) {
        return getNumbersFromCategory(category);
    }
`;

code = code.replace(search, replace);
fs.writeFileSync('./controllers/suggestionsController.js', code);
console.log('Fixed suggestionsController');
