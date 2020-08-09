const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Debit = db.define('debit', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true
  },
  accNumber: {type: DataTypes.STRING(20), allowNull: false},
  bankName: {type: DataTypes.STRING(30), allowNull: false},
  accType: {type: DataTypes.STRING(10), allowNull: false},
  description: {type: DataTypes.TEXT, allowNull: false},
  totalAmount: {type: DataTypes.DECIMAL(15,2), allowNull: false},
  feeTotalAmount: {type: DataTypes.DECIMAL(15,2), allowNull: false},
  debitType: {type: DataTypes.STRING(20), allowNull: false},
  startPaymentDate: {type: DataTypes.DATEONLY, allowNull: false},
  endPaymentDate: DataTypes.DATEONLY,
  paymentPeriod: {type: DataTypes.STRING(20), allowNull: false},
  paymentFrequency: DataTypes.DECIMAL(2),
  remainingPayments: DataTypes.DECIMAL(2),
  remainingAmount: {type: DataTypes.DECIMAL(15, 2), allowNull: false},
  feeAmount: {type: DataTypes.DECIMAL(15, 2), allowNull: false},
  debitKey: {type: DataTypes.STRING(40), allowNull: false},
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  fees: DataTypes.VIRTUAL
});

module.exports = Debit;