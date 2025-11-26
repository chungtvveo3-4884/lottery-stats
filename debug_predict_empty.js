
const { SETS, findNextInSet, findPreviousInSet, INDEX_MAPS, getTongTT, getTongMoi, getHieu } = require('./utils/numberAnalysis');

// Mock function from suggestionsController/exclusionService
function getSequence(cat) {
    if (cat.startsWith('tong_tt_')) {
        const suffix = cat.replace('tong_tt_', '');
        if (suffix === 'cac_tong') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        // ... (simplified)
    }
    // ... (simplified)
    if (cat === 'dau_nho_dit_nho') return SETS['DAU_NHO_DIT_NHO'] || [];
    // ...
    return null;
}

function extractValue(val, cat) {
    const strVal = String(val).padStart(2, '0');
    if (cat.startsWith('tong_tt_')) return String(getTongTT(strVal));
    if (cat === 'dau_nho_dit_nho') return strVal;
    return strVal;
}

function predict(lastValue, category, subcategory) {
    const isProgressive = subcategory.includes('tien');
    const isUniform = subcategory.includes('Deu');

    const lastValueToPredict = extractValue(lastValue, category);
    const numberSet = getSequence(category);

    if (!numberSet) return "No Set";

    const indexMap = new Map(numberSet.map((v, i) => [v, i]));

    let nextVal = null;
    if (isUniform) {
        nextVal = isProgressive
            ? findNextInSet(lastValueToPredict, numberSet, indexMap)
            : findPreviousInSet(lastValueToPredict, numberSet, indexMap);
    }

    return {
        lastValue,
        category,
        lastValueToPredict,
        nextVal,
        inSet: indexMap.has(lastValueToPredict)
    };
}

// Test cases
const cases = [
    { val: "93", cat: "tong_tt_cac_tong", sub: "luiDeuLienTiep" }, // Tong 2 -> 1?
    { val: "00", cat: "dau_nho_dit_nho", sub: "luiDeuLienTiep" }, // 00 -> ?
    { val: "01", cat: "dau_nho_dit_nho", sub: "luiDeuLienTiep" },
];

cases.forEach(c => {
    console.log(JSON.stringify(predict(c.val, c.cat, c.sub), null, 2));
});
