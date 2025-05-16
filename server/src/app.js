const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const sportsRoutes = require('./routes/sportsRoutes');
const oddsRoutes = require('./routes/odds');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/odds', oddsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = app; 