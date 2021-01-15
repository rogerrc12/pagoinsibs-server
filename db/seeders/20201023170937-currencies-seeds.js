"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "currencies",
      [
        {
          name: "bolivares",
          ISO: "VEN",
          symbol: "Bs.",
          buyPrice: 1.0,
          sellPrice: 1.0,
        },
        {
          name: "dolares",
          ISO: "USD",
          symbol: "$",
          buyPrice: 459000.0,
          sellPrice: 465000.0,
        },
      ],
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
