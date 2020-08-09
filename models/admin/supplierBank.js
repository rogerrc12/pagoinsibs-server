const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const SupplierBank = db.define('supplierBank', {
  id: {
    type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true
  },
  accNumber: {type: DataTypes.STRING(20), allowNull: false, unique: true},
  accType: {type: DataTypes.STRING(10), allowNull: false}
});

module.exports = SupplierBank;