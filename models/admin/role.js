const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const Role = db.define('role', {
  id: {
    type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true
  },
  roleName: DataTypes.STRING(20)
}, { timestamps: false });

module.exports = Role;