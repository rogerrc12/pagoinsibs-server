const { DataTypes } = require('sequelize');
const db = require('../config/db');

const AccPayment = db.define('accPayment', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true
  },
  description: {type: DataTypes.STRING, allowNull: false},
  amount: {type: DataTypes.DECIMAL(15, 2), allowNull: false},
  accNumber: {type: DataTypes.STRING(20), allowNull: false},
  bankName: {type: DataTypes.STRING(50), allowNull: false},
  accType: {type: DataTypes.STRING(15), allowNull: false},
  startPaymentDate: {type: DataTypes.DATEONLY, allowNull: false},
  endPaymentDate: DataTypes.DATEONLY,
  paymentKey: {type: DataTypes.STRING(40), allowNull: false, unique: true},
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 }
});

module.exports = AccPayment;