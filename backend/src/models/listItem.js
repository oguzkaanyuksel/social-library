const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ListItem = sequelize.define('ListItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  list_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lists',
      key: 'id'
    }
  },
  content_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contents',
      key: 'id'
    }
  },
  added_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'list_items',
  timestamps: false
});

module.exports = ListItem;
