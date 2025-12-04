// backend/src/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'social_library',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || 'Sqlemcuren31',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    }
  }
);

module.exports = sequelize;
