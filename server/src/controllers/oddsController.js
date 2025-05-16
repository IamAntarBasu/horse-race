const db = require('../database/connection');

const oddsController = {
  // Get all odds for a market
  async getMarketOdds(req, res) {
    const { marketId } = req.params;
    try {
      const odds = await db('market_odds').where({ market_id: marketId });
      res.json({ odds });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch market odds' });
    }
  },

  // Get odds for a runner in a market
  async getRunnerOdds(req, res) {
    const { marketId, runnerId } = req.params;
    try {
      const odds = await db('market_odds').where({ market_id: marketId, runner_id: runnerId }).first();
      res.json({ odds });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch runner odds' });
    }
  },

  // Update odds for a runner in a market
  async updateRunnerOdds(req, res) {
    const { marketId, runnerId } = req.params;
    const { back_odds, back_size, lay_odds, lay_size } = req.body;
    try {
      await db('market_odds')
        .insert({ market_id: marketId, runner_id: runnerId, back_odds, back_size, lay_odds, lay_size, updated_at: db.fn.now() })
        .onConflict(['market_id', 'runner_id'])
        .merge();
      res.json({ message: 'Odds updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update odds' });
    }
  }
};

module.exports = oddsController; 