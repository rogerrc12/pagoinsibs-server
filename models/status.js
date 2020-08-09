const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Status = db.define('status', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {type: DataTypes.STRING(10), allowNull: false}
}, {tableName: 'status', timestamps: false});

module.exports = Status;