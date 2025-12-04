const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rating = sequelize.define('Rating', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull:false },
  content_id: { type: DataTypes.INTEGER, allowNull:false },
  value: { type: DataTypes.INTEGER, allowNull:false } // 1..10
});

module.exports = Rating;
