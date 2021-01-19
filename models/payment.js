const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Payment = db.define("payment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  },
  description: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  startPaymentDate: { type: DataTypes.DATEONLY, allowNull: false },
  endPaymentDate: DataTypes.DATEONLY,
  paymentKey: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  paymentType: { type: DataTypes.STRING(15), allowNull: false },
  accNumber: DataTypes.STRING(20),
  bankName: DataTypes.STRING(50),
  accType: DataTypes.STRING(15),
  withCurrencyConversion: { type: DataTypes.BOOLEAN, defaultValue: false },
  paypalEmail: DataTypes.STRING,
  zelleEmail: DataTypes.STRING,
  cardBrand: DataTypes.STRING(6),
  cardLastNumbers: DataTypes.STRING(4),
});

module.exports = Payment;
