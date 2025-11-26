// Debug key parsing for composite patterns
const key1 = 'dau_nho_dit_to:luiLienTiep';
const key2 = 'dau_nho_dit_to:luiDeuLienTiep';

function parseKey(key) {
    let category, subcategory;

    if (key.includes(':')) {
        [category, subcategory] = key.split(':');
    } else {
        // Extract subcategory from end of key
        const patterns = [
            'LuiDeuLienTiep', 'TienDeuLienTiep',
            'LuiLienTiep', 'TienLienTiep',
            'LuiDeu', 'TienDeu',
            'VeLienTiep', 'VeCungGiaTri', 'VeSole', 'VeSoleMoi',
            'DongTien', 'DongLui'
        ];

        for (const pattern of patterns) {
            if (key.endsWith(pattern)) {
                subcategory = pattern.charAt(0).toLowerCase() + pattern.slice(1);
                category = key.slice(0, -pattern.length);
                break;
            }
        }

        if (!subcategory) {
            category = key;
            subcategory = '';
        }
    }

    return { category, subcategory, originalKey: key };
}

console.log('Test 1:', parseKey(key1));
console.log('Test 2:', parseKey(key2));
console.log('Test 3:', parseKey('cacSoLuiDeuLienTiep'));
