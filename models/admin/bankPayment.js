const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const BankPayment = db.define('bankPayment', {
  id: {
    type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true
  },
  registerID: { type: DataTypes.INTEGER, allowNull: false }, 
  amount: {type: DataTypes.DECIMAL(15, 2), allowNull: false},
  clientAccNumber: {type: DataTypes.STRING(20), allowNull: false}
});

module.exports = BankPayment;