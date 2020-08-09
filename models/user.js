const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const User = db.define('user', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true, autoIncrement: true, allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    cedula: {
        type: DataTypes.STRING(12),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    address: DataTypes.STRING,
    city: DataTypes.STRING(50),
    phone: DataTypes.STRING(20),
    birthday: DataTypes.DATE,
    gender: DataTypes.STRING(1),
    username: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    clientId: {
        type: DataTypes.STRING(12),
        allowNull: false,
        unique: false
    },
    lastLogin : DataTypes.DATE,
    profileCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    resetToken: {
        type: DataTypes.STRING(40),
        unique: true
    },
    resetTokenExp: DataTypes.DATE
}, { timestamps: true });

module.exports = User;