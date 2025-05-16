const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin: Get all users with their balance
router.get('/all-with-balance', userController.getAllUsersWithBalance);
// Update balance for a particular user
router.put('/balance/:userId', userController.updateBalance);
// Fetch balance for a particular user
router.get('/balance/:userId', userController.getBalance);
// Handle user deposit
router.post('/deposit', authMiddleware, userController.deposit);

module.exports = router; 