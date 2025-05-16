const express = require('express');
const router = express.Router();
const betsController = require('../controllers/betsController');
const authMiddleware = require('../middleware/authMiddleware');

// Place a bet
router.post('/', authMiddleware, betsController.placeBet);
// Get all open bets for a user
router.get('/open', authMiddleware, betsController.getUserOpenBets);
// Get all bets for a user by market_id
router.get('/by-market', authMiddleware, betsController.getUserBetsByMarket);

module.exports = router; 