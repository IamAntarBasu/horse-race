const express = require('express');
const router = express.Router();
const sportsController = require('../controllers/sportsController');

// GET /api/sports and /api/sports/
// router.get(['/', ''], getSportsData);
router.get('/', sportsController.getExternalSportsData);

module.exports = router; 