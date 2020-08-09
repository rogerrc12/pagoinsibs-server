const { DataTypes } = require('sequelize');
const db = require('../config/db');

const ThirdPartyAccount = db.define('thirdPartyAccount', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    accNumber: {
        type: DataTypes.STRING(21),
        allowNull: false,
        unique: true
    },
    accType: { type: DataTypes.STRING(10), allowNull: false },
    toSend: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    toReceive: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
}, { timestamps: true });

module.exports = ThirdPartyAccount;