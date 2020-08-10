const pg = require("pg");
const { Sequelize } = require("sequelize");

const db = new Sequelize(process.env.DATABASE_URL, {
  host: "pagoinsibs-node-server",
  dialect: "postgres",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
});

pg.types.setTypeParser(1700, parseFloat);

module.exports = db;
