const { DataTypes } = require('sequelize');
const db = require('../config/db');

const CcPayment = db.define('ccPayment', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true
  },
  description: {type: DataTypes.STRING, allowNull: false},
  amount: {type: DataTypes.DECIMAL(15, 2), allowNull: false},
  cardBrand: {type: DataTypes.STRING(6), allowNull: false},
  cardLastNumbers: {type: DataTypes.STRING(4), allowNull: false},
  paymentKey: {type: DataTypes.STRING(40), allowNull: false, unique: true}
})

module.exports = CcPayment;