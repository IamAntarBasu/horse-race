const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration } = require('../middleware/validationMiddleware');

// Register new user
router.post('/register', validateRegistration, authController.register);

// Login user
router.post('/login', authController.login);

// Verify token
router.get('/verify', authController.verifyToken);

module.exports = router; 