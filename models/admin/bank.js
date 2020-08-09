const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const Bank = db.define('bank', {
    id: {
        type: DataTypes.STRING(4),
        allowNull: false, primaryKey: true, unique: true
    },
    bankName: { type: DataTypes.STRING(40), allowNull: false },
    bankImg: { type: DataTypes.STRING(20), allowNull: false },
    isInsibs: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: false });

module.exports = Bank;