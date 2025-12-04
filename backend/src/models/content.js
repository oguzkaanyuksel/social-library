const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Content = sequelize.define('Content', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  external_id: { type: DataTypes.STRING, allowNull: false },
  source: { type: DataTypes.ENUM('tmdb','googlebooks','openlibrary'), allowNull:false },
  type: { type: DataTypes.ENUM('movie','book'), allowNull:false },
  title: { type: DataTypes.TEXT, allowNull:false },
  overview: { type: DataTypes.TEXT },
  year: { type: DataTypes.STRING },
  poster_url: { type: DataTypes.STRING },
  metadata: { type: DataTypes.JSON }
}, {
  indexes: [{ fields: ['external_id','source'] }]
});

module.exports = Content;
