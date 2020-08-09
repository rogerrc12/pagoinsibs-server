const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const Correlative = db.define('correlative', {
  id: {
    type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true
  },
  correlative: {type: DataTypes.INTEGER, unique: true },
  processed: {type: DataTypes.BOOLEAN, defaultValue: false}
});

module.exports = Correlative;