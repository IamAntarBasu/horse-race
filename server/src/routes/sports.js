const express = require('express');
const router = express.Router();
const sportsController = require('../controllers/sportsController');

// router.get('/', sportsController.getSportsData);
// Add this route for the external API
router.get('/external', sportsController.getExternalSportsData);
router.get('/', sportsController.getExternalSportsData);

module.exports = router; 