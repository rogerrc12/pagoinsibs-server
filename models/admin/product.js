const { DataTypes } = require("sequelize");
const db = require("../../config/db");

const Product = db.define(
  "product",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    interestRate: { type: DataTypes.DECIMAL(6, 4) },
    maxDebitMonths: { type: DataTypes.INTEGER },
    currencyConversion: { type: DataTypes.BOOLEAN, defaultValue: false },
    isDirectDebit: { type: DataTypes.BOOLEAN, allowNull: false },
  },
  { paranoid: true }
);

module.exports = Product;
