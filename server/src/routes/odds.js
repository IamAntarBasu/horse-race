const express = require('express');
const router = express.Router();
const oddsController = require('../controllers/oddsController');

// Get all odds for a market
router.get('/:marketId', oddsController.getMarketOdds);
// Get odds for a runner in a market
router.get('/:marketId/:runnerId', oddsController.getRunnerOdds);
// Update odds for a runner in a market
router.put('/:marketId/:runnerId', oddsController.updateRunnerOdds);

module.exports = router; 