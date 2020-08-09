"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "users",
      [
        {
          firstName: "Roger",
          lastName: "Rengifo",
          cedula: "V22290471",
          email: "thelea12@gmail.com",
          username: "rogerrc12",
          hash: "$2a$12$Csi9tbY0n3noXUAulnQn9u25Aji5iM404pr6T4qCb.TxHfg143GH6",
          clientId: "INB85N7KON02",
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
