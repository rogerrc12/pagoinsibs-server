const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Currency = db.define(
  "currency",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ISO: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    buyPrice: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    sellPrice: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
  },
  { timestamps: false }
);

module.exports = Currency;
