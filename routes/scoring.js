const express = require('express');
const router = express.Router();
const { getScoringResults } = require('../utils/lotteryScoring');
const { scoringForms } = require('../utils/numberPatterns');

// GET route to display the scoring form and results
router.get('/', (req, res) => {
    try {
        const { startDate, endDate, mode, searchType, occurrenceCount, selectedForms } = req.query;
        
        // Check if there are enough parameters to perform a search
        if (!startDate || !endDate || !mode) {
            // Render the page without any results, just the form
            return res.render('scoring-form', {
                // Pass undefined or empty values so EJS doesn't crash
                results: undefined, 
                aggregateResults: [],
                message: 'Vui lòng chọn các tùy chọn và nhấn "Tìm kiếm" để xem kết quả.',
                scoringForms: scoringForms, // Pass form definitions for checkboxes
                // Pass back any existing query params to keep the form state
                startDate: startDate || '',
                endDate: endDate || '',
                mode: mode || 'de',
                searchType: searchType || 'occurrence',
                occurrenceCount: occurrenceCount || '',
                selectedForms: selectedForms || ''
            });
        }
        
        // If query parameters are present, proceed to calculate results
        const lotteryData = req.app.get('lotteryData');
        if (!lotteryData || lotteryData.length === 0) {
            throw new Error('Dữ liệu xổ số chưa được tải hoặc không có sẵn.');
        }

        const scoringData = getScoringResults({
            lotteryData,
            startDate,
            endDate,
            mode,
            searchType,
            occurrenceCount,
            selectedForms
        });

        // Render the page with the calculated results
        res.render('scoring-form', {
            results: scoringData.results,
            aggregateResults: scoringData.aggregateResults,
            message: scoringData.results.length === 0 ? 'Không tìm thấy kết quả nào phù hợp với điều kiện tìm kiếm.' : null,
            scoringForms: scoringForms,
            // Pass aggregation info to the view
            aggStartDate: scoringData.aggStartDate,
            aggEndDate: scoringData.aggEndDate,
            aggMode: scoringData.aggMode,
            // Pass back query params to repopulate the form
            startDate,
            endDate,
            mode,
            searchType,
            occurrenceCount,
            selectedForms
        });

    } catch (error) {
        console.error('Error in /scoring route:', error);
        res.status(500).render('scoring-form', {
            results: undefined,
            aggregateResults: [],
            message: `Đã xảy ra lỗi nghiêm trọng: ${error.message}`,
            scoringForms: scoringForms,
            startDate: req.query.startDate || '',
            endDate: req.query.endDate || '',
            mode: req.query.mode || 'de',
            searchType: req.query.searchType || 'occurrence',
            occurrenceCount: req.query.occurrenceCount || '',
            selectedForms: req.query.selectedForms || ''
        });
    }
});

module.exports = router;