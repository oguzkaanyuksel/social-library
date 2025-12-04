const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  username: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  avatar: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  bio: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  resetPasswordToken: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  resetPasswordExpires: { 
    type: DataTypes.DATE, 
    allowNull: true 
  }
}, {
  indexes: [
    { fields: ['email'] },
    { fields: ['username'] }
  ]
});

module.exports = User;
