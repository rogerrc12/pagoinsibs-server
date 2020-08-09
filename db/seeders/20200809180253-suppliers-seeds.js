"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "suppliers",
      [
        {
          name: "CENTRO HISPANO VENEZOLANO DE ARAGUA",
          rif: "J309052845",
          address: "AVDA INTERCOMUNAL SANTIAGO MARIÑO, TURMERO, Aragua",
          email: "roy@atlantidascs.com",
          managerFirstName: "ROY",
          managerLastName: "RENGIFO",
          localPhone: "0212-9516280",
          mobilePhone: "0212-9516276",
          supplierTypeId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
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
