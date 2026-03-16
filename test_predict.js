const { predictNextInSequence, getNumbersFromCategory } = require('./controllers/suggestionsController');
// Let's modify suggestionsController to export predictNextInSequence
const fs = require('fs');
let code = fs.readFileSync('./controllers/suggestionsController.js', 'utf8');
if (!code.includes('exports.predictNextInSequence = predictNextInSequence;')) {
    code += '\nexports.predictNextInSequence = predictNextInSequence;\n';
    fs.writeFileSync('./controllers/suggestionsController.js', code);
    console.log('Exported predictNextInSequence');
}
