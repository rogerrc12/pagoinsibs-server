const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Debit = db.define("debit", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  },
  accNumber: DataTypes.STRING(20),
  bankName: DataTypes.STRING(50),
  accType: DataTypes.STRING(15),
  description: { type: DataTypes.TEXT, allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  remainingAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  feeAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  debitType: { type: DataTypes.STRING(20), allowNull: false },
  paymentType: { type: DataTypes.STRING(15), allowNull: false },
  startPaymentDate: { type: DataTypes.DATEONLY, allowNull: false },
  endPaymentDate: DataTypes.DATEONLY,
  paymentPeriod: { type: DataTypes.STRING(20), allowNull: false },
  paymentFrequency: DataTypes.DECIMAL(2),
  remainingPayments: DataTypes.DECIMAL(2),
  debitKey: { type: DataTypes.STRING(40), allowNull: false },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  withCurrencyConversion: { type: DataTypes.BOOLEAN, defaultValue: false },
  fees: DataTypes.VIRTUAL,
});

module.exports = Debit;
