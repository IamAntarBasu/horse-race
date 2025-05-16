require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: 'postgresql-incognichat.alwaysdata.net',
      user: 'incognichat_antar',
      password: 'IncogniChat@2023',
      database: 'incognichat_horse_race',
      port: 5432
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
}; 