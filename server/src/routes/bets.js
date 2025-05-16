const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const betsController = require('../controllers/betsController');

// Place a bet
router.post('/', auth, betsController.placeBet);

// Get all open bets for a user
router.get('/open', auth, betsController.getUserOpenBets);

// Get bets by market
router.get('/by-market', auth, betsController.getUserBetsByMarket);

// Get bet history
router.get('/history', auth, betsController.getBetHistory);

module.exports = router; 