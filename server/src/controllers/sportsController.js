const sportsData = require('../models/SportsData');
const axios = require('axios');
const db = require('../database/connection');

// Helper to merge admin odds into the book string
function mergeAdminOddsToBook(bookStr, marketId, adminOddsMap) {
  if (!bookStr) return bookStr;
  const parts = bookStr.split('|');
  const runnersStr = parts[parts.length - 1];
  const runnersArr = runnersStr.split(',');
  const newRunnersArr = runnersArr.map(runnerStr => {
    if (!runnerStr) return '';
    const [runnerId, status, oddsStr] = runnerStr.split('~');
    const adminOdds = adminOddsMap[runnerId];
    if (adminOdds && status === 'ACTIVE') {
      // Keep original back odds if admin back odds not set
      const back = adminOdds.back_odds && adminOdds.back_size ? 
        `${adminOdds.back_odds}:${adminOdds.back_size}:` : 
        oddsStr.split('*')[0] || '';
      
      // Always use admin lay odds if set, otherwise use original lay odds
      const lay = adminOdds.lay_odds && adminOdds.lay_size ? 
        `${adminOdds.lay_odds}:${adminOdds.lay_size}:` : 
        (oddsStr.split('*')[1] || '');
      
      // Combine back and lay odds
      const newOddsStr = [back, '*', lay].join('');
      return [runnerId, status, newOddsStr].join('~');
    }
    return runnerStr;
  });
  parts[parts.length - 1] = newRunnersArr.join(',');
  return parts.join('|');
}

// Helper to automatically settle a market if needed
async function settleMarketIfNeeded(market) {
  const marketId = market.catalogue.marketId;
  // Only settle if not already settled
  const alreadySettled = await db('bets').where({ market_id: marketId, status: 'settled' }).first();
  if (alreadySettled) return;
  // Find the winner
  const winner = (market.catalogue.runners || []).find(r => r.status === 'WINNER');
  if (!winner) return;
  // Settle all open bets for this market
  const bets = await db('bets').where({ market_id: marketId, status: 'open' });
  for (const bet of bets) {
    let isWin = false;
    if (bet.bet_type === 'back' && bet.runner_id == winner.id) isWin = true;
    if (bet.bet_type === 'lay' && bet.runner_id != winner.id) isWin = true;
    let settledAmount = 0;
    if (isWin) {
      settledAmount = bet.potential_payout;
      await db('balance').where({ user_id: bet.user_id }).increment('balance', settledAmount);
    } else {
      settledAmount = -bet.liability;
      await db('balance').where({ user_id: bet.user_id }).decrement('balance', bet.liability);
    }
    await db('bets').where({ id: bet.id }).update({
      status: 'settled',
      settled_at: db.fn.now(),
      settled_amount: settledAmount,
      settlement_status: isWin ? 'win' : 'lose'
    });
    // Optionally, update exposure here as well
  }
}

const getSportsData = async (req, res) => {
  try {
    // Fetch external data
    const response = await axios.get('https://test-ih06d35xn-furqan5921s-projects.vercel.app/api/v1/sports/7');
    let data = response.data.data;
    // Fetch all admin odds
    const allAdminOdds = await db('market_odds');
    console.log('All admin odds:', allAdminOdds); // DEBUG LOG
    // Build a map: { marketId: { runnerId: oddsObj } }
    const adminOddsMap = {};
    allAdminOdds.forEach(o => {
      if (!adminOddsMap[o.market_id]) adminOddsMap[o.market_id] = {};
      adminOddsMap[o.market_id][o.runner_id] = o;
    });
    // Merge admin odds into each market's book string
    data = await Promise.all(data.map(async market => {
      const marketId = market.catalogue.marketId;
      if (market.metadata && market.metadata.book && adminOddsMap[marketId]) {
        console.log('Merging for market:', marketId, adminOddsMap[marketId]); // DEBUG LOG
        market.metadata.book = mergeAdminOddsToBook(market.metadata.book, marketId, adminOddsMap[marketId]);
      }
      // Automatic settlement logic
      if (['CLOSED', 'SETTLED', 'SUSPENDED'].includes(market.catalogue.status)) {
        await settleMarketIfNeeded(market);
      }
      return market;
    }));
    res.json({ message: 'sports data', data });
  } catch (error) {
    console.error('Error fetching sports data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch sports data'
    });
  }
};

// Proxy to external sports API (raw, for admin reference)
const getExternalSportsData = async (req, res) => {
  try {
    const response = await axios.get('https://test-ih06d35xn-furqan5921s-projects.vercel.app/api/v1/sports/7');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching external sports data:', error.message);
    res.status(500).json({ error: 'Failed to fetch sports data' });
  }
};

const sportsController = {
  getSportsData,
  getExternalSportsData
};

module.exports = sportsController; 