const axios = require('axios');

async function checkAPI() {
    try {
        const response = await axios.get('http://localhost:6868/api/suggestions');
        const explanations = response.data.explanations;

        console.log(`Total explanations: ${explanations.length}\n`);

        explanations.forEach((exp, idx) => {
            console.log(`${idx + 1}. ${exp.title}`);
            if (exp.numbers && exp.numbers.length > 0) {
                console.log(`   Numbers: ${exp.numbers.join(', ')}`);
            }
        });

        // Check if tong_tt_3_5 is in there
        const hasTongTT35 = explanations.some(exp => exp.title.includes('tong_tt_3_5') || exp.title.includes('Tổng 3-5'));
        console.log(`\nHas tong_tt_3_5 rule: ${hasTongTT35}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAPI();
