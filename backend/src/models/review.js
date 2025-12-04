const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull:false },
  content_id: { type: DataTypes.INTEGER, allowNull:false },
  text: { type: DataTypes.TEXT, allowNull:false },
});

module.exports = Review;
