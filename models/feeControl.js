const { DataTypes } = require('sequelize');
const db = require('../config/db');

const FeeControl = db.define('feeControl', {
  id: {
    type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false
  },
  feeNo: {type: DataTypes.INTEGER, allowNull: false},
  paymentDate: {type: DataTypes.DATEONLY, allowNull: false},
  dueDate: {type: DataTypes.DATE, allowNull: false},
  completedDate: DataTypes.DATEONLY
}, {timestamps: false});

module.exports = FeeControl;