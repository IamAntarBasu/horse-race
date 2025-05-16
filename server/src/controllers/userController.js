const db = require('../database/connection');

const userController = {
  // Get all users with their balance (for admin)
  async getAllUsersWithBalance(req, res) {
    try {
      const users = await db('users')
        .leftJoin('balance', 'users.id', 'balance.user_id')
        .select(
          'users.id',
          'users.username',
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.role',
          'users.is_active',
          'balance.balance',
          'balance.exposure',
          'balance.previousbalance',
          'balance.previousexposure',
          'balance.balance_updated_at'
        );
      res.json({ users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Update balance for a particular user
  async updateBalance(req, res) {
    const { userId } = req.params;
    const { balance } = req.body;
    try {
      // Get current balance and exposure
      const current = await db('balance').where({ user_id: userId }).first();
      // Update balance, set previousbalance
      await db('balance')
        .where({ user_id: userId })
        .update({
          previousbalance: current.balance,
          balance,
          balance_updated_at: db.fn.now()
        });
      return res.json({ message: 'Balance updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update balance' });
    }
  },

  // Fetch balance for a particular user
  async getBalance(req, res) {
    const { userId } = req.params;
    try {
      const balance = await db('balance').where({ user_id: userId }).first();
      if (!balance) {
        return res.status(404).json({ error: 'User balance not found' });
      }
      return res.json({ balance });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  },

  // Handle user deposit
  async deposit(req, res) {
    const { user_id, amount } = req.body;
    
    if (!user_id || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    try {
      // Get current balance
      const currentBalance = await db('balance').where({ user_id }).first();
      
      if (!currentBalance) {
        return res.status(404).json({ error: 'User balance not found' });
      }

      // Update balance with new deposit
      await db('balance')
        .where({ user_id })
        .update({
          previousbalance: currentBalance.balance,
          balance: parseFloat(currentBalance.balance) + parseFloat(amount),
          balance_updated_at: db.fn.now()
        });

      // Get updated balance
      const updatedBalance = await db('balance').where({ user_id }).first();
      
      return res.json({ 
        message: 'Deposit successful',
        balance: updatedBalance
      });
    } catch (error) {
      console.error('Deposit error:', error);
      res.status(500).json({ error: 'Failed to process deposit' });
    }
  }
};

module.exports = userController; 