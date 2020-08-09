"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "adminUsers",
      [
        {
          firstName: "Roger",
          lastName: "Rengifo",
          cedula: "V22290471",
          email: "thelea12@gmail.com",
          hash: "$2a$12$Csi9tbY0n3noXUAulnQn9u25Aji5iM404pr6T4qCb.TxHfg143GH6",
          roleId: 1,
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
