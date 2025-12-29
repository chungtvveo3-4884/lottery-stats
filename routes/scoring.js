const express = require('express');
const router = express.Router();
const { getScoringResults, scoringForms } = require('../utils/lotteryScoring');

// GET route to display the scoring form and results
router.get('/', (req, res) => {
    try {
        const { startDate, endDate, mode, searchType, occurrenceCount, selectedForms } = req.query;
        const lotteryData = req.app.get('lotteryData');

        // Always try to calculate aggregate results for the default period (from start of year)
        let scoringData = { results: [], scoringForms: scoringForms };

        if (lotteryData && lotteryData.length > 0) {
            // Calculate default aggregate data (from start of current year to today)
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of current year

            const defaultStartDate = startOfYear.toISOString().split('T')[0];
            const defaultEndDate = today.toISOString().split('T')[0];

            try {
                scoringData = getScoringResults({
                    lotteryData,
                    startDate: startDate || defaultStartDate,
                    endDate: endDate || defaultEndDate,
                    mode: mode || 'de',
                    searchType: searchType || 'occurrence',
                    occurrenceCount: occurrenceCount || 0,
                    selectedForms: selectedForms || ''
                });
                scoringData.scoringForms = scoringForms;
            } catch (calcError) {
                console.error('Error calculating scoring data:', calcError);
                scoringData = { results: [], scoringForms: scoringForms };
            }
        }

        // Render the page with scoringData
        res.render('scoring-form.html', {
            scoringData: scoringData,
            // Also pass individual variables for EJS template backwards compatibility
            results: scoringData.results || [],
            aggregateResults: scoringData.aggregateResults || [],
            scoringForms: scoringForms,
            aggStartDate: scoringData.aggStartDate || '',
            aggEndDate: scoringData.aggEndDate || '',
            aggMode: scoringData.aggMode || 'de',
            message: scoringData.results?.length === 0 ? 'Chưa có kết quả. Vui lòng thực hiện tìm kiếm.' : null,
            // Pass back query params
            startDate: startDate || '',
            endDate: endDate || '',
            mode: mode || 'de',
            searchType: searchType || 'occurrence',
            occurrenceCount: occurrenceCount || '',
            selectedForms: selectedForms || ''
        });

    } catch (error) {
        console.error('Error in /scoring route:', error);
        res.status(500).render('scoring-form.html', {
            scoringData: { results: [], scoringForms: scoringForms },
            results: [],
            aggregateResults: [],
            message: `Đã xảy ra lỗi: ${error.message}`,
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