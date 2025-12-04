const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Genre = sequelize.define('Genre', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('movie', 'book'),
    allowNull: false
  }
}, {
  tableName: 'genres',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['name', 'type']
    }
  ]
});

module.exports = Genre;