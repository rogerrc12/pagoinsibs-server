const { DataTypes } = require("sequelize");
const db = require("../../config/db");

const Supplier = db.define(
  "supplier",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    rif: { type: DataTypes.STRING(14), allowNull: false, unique: true },
    address: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    managerFirstName: { type: DataTypes.STRING(20), allowNull: false },
    managerLastName: { type: DataTypes.STRING(20), allowNull: false },
    localPhone: { type: DataTypes.STRING(15), allowNull: false },
    mobilePhone: { type: DataTypes.STRING(15), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { timestamps: true }
);

module.exports = Supplier;
