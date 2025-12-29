/**
 * Distribution Analysis Routes
 */

const express = require('express');
const router = express.Router();
const distributionController = require('../controllers/distributionController');

// Get all distributions for dashboard
router.get('/all', distributionController.getAllDistributions);

// Get specific category distribution
router.get('/category/:category', distributionController.getCategoryDistribution);

// Get number heatmap (00-99)
router.get('/heatmap', distributionController.getNumberHeatmap);

// Get prediction candidates
router.get('/predictions', distributionController.getPredictions);

// Get available categories
router.get('/categories', distributionController.getCategories);

// [NEW] Get cached predictions (pre-computed)
router.get('/cached-predictions', distributionController.getCachedPredictions);

module.exports = router;
