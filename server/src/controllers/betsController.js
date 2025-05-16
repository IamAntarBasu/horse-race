const db = require('../database/connection');
const knex = require('../database/connection');

const betsController = {
  async placeBet(req, res) {
    const userId = req.user.id;
    const { market_id, runner_id, bet_type, odds, bet_amount, selection_name, market_name } = req.body;
    if (!market_id || !runner_id || !bet_type || !odds || !bet_amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['back', 'lay'].includes(bet_type)) {
      return res.status(400).json({ error: 'Invalid bet_type' });
    }
    const oddsNum = parseFloat(odds);
    const betAmountNum = parseFloat(bet_amount);
    if (oddsNum < 1.01 || betAmountNum <= 0) {
      return res.status(400).json({ error: 'Invalid odds or bet amount' });
    }
    // Calculate liability and potential payout
    let liability, potential_payout;
    if (bet_type === 'back') {
      liability = betAmountNum;
      potential_payout = (oddsNum - 1) * betAmountNum;
    } else {
      liability = (oddsNum - 1) * betAmountNum;
      potential_payout = betAmountNum;
    }
    // Fetch user balance
    const balanceRow = await db('balance').where({ user_id: userId }).first();
    if (!balanceRow) {
      return res.status(400).json({ error: 'User balance not found' });
    }
    if (parseFloat(balanceRow.balance) < liability) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    // Insert bet
    const [bet] = await db('bets')
      .insert({
        user_id: userId,
        market_id,
        runner_id,
        bet_type,
        odds: oddsNum,
        bet_amount: betAmountNum,
        liability,
        potential_payout,
        status: 'open',
        placed_at: db.fn.now(),
        selection_name,
        market_name
      })
      .returning('*');
    // Update balance and exposure
    await db('balance')
      .where({ user_id: userId })
      .update({
        previousbalance: balanceRow.balance,
        balance: parseFloat(balanceRow.balance) - liability,
        previousexposure: balanceRow.exposure,
        exposure: parseFloat(balanceRow.exposure) + liability,
        balance_updated_at: db.fn.now()
      });
    return res.json({ message: 'Bet placed successfully', bet });
  },

  // Get all current (open) bets for a user
  async getUserOpenBets(req, res) {
    const userId = req.user.id;
    try {
      const bets = await db('bets').where({ user_id: userId }).andWhere('status', 'open').orderBy('placed_at', 'desc');
      return res.json({ count: bets.length, bets });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch open bets' });
    }
  },

  // Get all bets for a user with a specific market_id
  async getUserBetsByMarket(req, res) {
    const userId = req.user.id;
    const { market_id } = req.query;
    if (!market_id) return res.status(400).json({ error: 'market_id is required' });
    try {
      const bets = await db('bets').where({ user_id: userId, market_id }).orderBy('placed_at', 'desc');
      return res.json({ count: bets.length, bets });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch bets for market' });
    }
  },

  // Get bet history for a market
  async getBetHistory(req, res) {
    try {
      const { market_id } = req.query;
      const userId = req.user.id;

      if (!market_id) {
        return res.status(400).json({ error: 'Market ID is required' });
      }

      const bets = await db('bets')
        .where({
          user_id: userId,
          market_id: market_id
        })
        .orderBy('created_at', 'desc');

      res.json({ bets });
    } catch (error) {
      console.error('Error fetching bet history:', error);
      res.status(500).json({ error: 'Failed to fetch bet history' });
    }
  }
};

module.exports = betsController; 