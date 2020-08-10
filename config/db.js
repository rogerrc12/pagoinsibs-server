const pg = require("pg");
const { Sequelize } = require("sequelize");

let dialectOptions;

if (process.env.NODE_ENV === "production") {
  dialectOptions = {
    ssl: {
      require: true,
    },
  };
} else {
  dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

const db = new Sequelize(process.env.DATABASE_URL, {
  host: "pagoinsibs-node-server",
  dialect: "postgres",
  protocol: "postgres",
  pool: {
    max: 7,
    min: 1,
    idle: 10000,
  },
  logging: false,
  dialectOptions,
});

pg.types.setTypeParser(1700, parseFloat);

module.exports = db;
