// Test getCategoryName logic
const testCases = [
    { key: 'cacSoLuiDeuLienTiep', expected: 'Các số - Lùi Đều' },
    { key: 'dau_nho:veLienTiep', expected: 'Đầu Nhỏ - Về liên tiếp' },
    { key: 'dau_nho_dit_to:luiLienTiep', expected: 'Đầu nhỏ-Đít to - Lùi liên tiếp' },
    { key: 'dau_nho_dit_to:luiDeuLienTiep', expected: 'Đầu nhỏ-Đít to - Lùi Đều' }
];

// Simulate the parsing logic from addExcludedNumber
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

    return { category, subcategory };
}

testCases.forEach(tc => {
    const parsed = parseKey(tc.key);
    console.log(`Key: ${tc.key}`);
    console.log(`  Parsed: category="${parsed.category}", subcategory="${parsed.subcategory}"`);
    console.log(`  Expected: ${tc.expected}`);
    console.log('');
});
