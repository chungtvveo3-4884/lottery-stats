/**
 * Unified Prediction Routes
 */

const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// Get daily prediction combining all methods
router.get('/daily', predictionController.getDailyPrediction);

// Get advanced prediction from 13 methods
router.get('/advanced', predictionController.getAdvancedPrediction);

// Get yearly comparison
router.get('/yearly-comparison', predictionController.getYearlyComparison);

// Evaluate prediction accuracy
router.post('/evaluate', predictionController.evaluatePrediction);

// Get AI prompt for external analysis
router.get('/ai-prompt', predictionController.getAIPrompt);

// Get prediction configuration
router.get('/config', predictionController.getConfig);

// Get detailed explanation for a specific number
router.get('/number/:number', predictionController.getNumberDetail);

module.exports = router;
