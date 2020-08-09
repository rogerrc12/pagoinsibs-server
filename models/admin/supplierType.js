const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const SupplierType = db.define('supplierType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
  name: {type: DataTypes.STRING(20), allowNull: false}
}, {timestamps: false});

module.exports = SupplierType;