require("dotenv").config();
module.exports = {
  development: {
    // username: "rogerrengifo",
    // password: null,
    // database: "pagoinsibs-dev",
    // host: "127.0.0.1",
    // dialect: "postgres",
    use_env_variable: "TEST_DB_URL",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    operatorsAliases: false,
  },
};
