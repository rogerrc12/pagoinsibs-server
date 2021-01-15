"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "status",
      [{ name: "pendiente" }, { name: "procesando" }, { name: "exitoso" }, { name: "fallido" }, { name: "vencido" }, { name: "cancelado" }],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
