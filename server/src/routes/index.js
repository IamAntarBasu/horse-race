const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const sportsRoutes = require('./sports');
const userRoutes = require('./userRoutes');
const betsRoutes = require('./betsRoutes');
const oddsRoutes = require('./odds');

router.use('/auth', authRoutes);
router.use('/sports', sportsRoutes);
router.use('/user', userRoutes);
router.use('/bets', betsRoutes);
router.use('/odds', oddsRoutes);
module.exports = router; 