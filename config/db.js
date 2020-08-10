const pg = require("pg");
const { Sequelize } = require("sequelize");

let db;

if (process.env.NODE_ENV === "development") {
  db = new Sequelize(process.env.DATABASE_URL, {
    host: "pagoinsibs-node-server",
    dialect: "postgres",
    protocol: "postgres",
    pool: {
      max: 7,
      min: 1,
      idle: 10000,
    },
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  db = new Sequelize(process.env.DATABASE_URL, {
    host: "pagoinsibs-node-server",
    dialect: "postgres",
    protocol: "postgres",
    pool: {
      max: 7,
      min: 1,
      idle: 10000,
    },
    logging: false,
  });
}

pg.types.setTypeParser(1700, parseFloat);

module.exports = db;
