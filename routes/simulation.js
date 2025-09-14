const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

router.get('/', simulationController.getSimulationPage);
router.post('/submit', simulationController.submitSimulation);
router.get('/stats', simulationController.getSimulationStats);
router.post('/edit/:id', simulationController.editSimulation); // ROUTE MỚI

module.exports = router;