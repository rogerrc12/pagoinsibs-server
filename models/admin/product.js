const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const Product = db.define('product', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {type: DataTypes.STRING, allowNull: false},
  amount: {type: DataTypes.DECIMAL(15, 2), allowNull: false},
  interestRate: {type: DataTypes.DECIMAL(6, 4), defaultValue: 0},
  maxDebitMonths: {type: DataTypes.INTEGER, defaultValue: 12},
});

module.exports = Product;