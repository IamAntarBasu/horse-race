const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'postgresql-incognichat.alwaysdata.net',
  username: 'incognichat_antar',
  password: 'IncogniChat@2023',
  port: 5432,
  database: 'incognichat_horse_race',
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

testConnection();

module.exports = sequelize; 