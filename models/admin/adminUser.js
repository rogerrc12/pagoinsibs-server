const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const AdminUser = db.define('adminUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true, autoIncrement: true, allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  cedula: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: false
  }});

module.exports = AdminUser;