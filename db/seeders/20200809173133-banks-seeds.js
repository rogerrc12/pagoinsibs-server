"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "banks",
      [
        {
          id: "0156",
          bankName: "100% Banco",
          bankImg: "100_banco.png",
        },
        {
          id: "0172",
          bankName: "Bancamiga",
          bankImg: "bancamiga.png",
        },
        {
          id: "0171",
          bankName: "Banco Activo",
          bankImg: "banco_activo.png",
        },
        {
          id: "0175",
          bankName: "Banco Bicentenario",
          bankImg: "bicentenario.png",
          isInsibs: true,
        },
        {
          id: "0128",
          bankName: "Banco Caroni",
          bankImg: "banco_caroni.png",
        },
        {
          id: "0102",
          bankName: "Banco de Venezuela",
          bankImg: "venezuela.png",
          isInsibs: true,
        },
        {
          id: "0114",
          bankName: "Banco del Caribe",
          bankImg: "bancaribe.png",
        },
        {
          id: "0163",
          bankName: "Banco del Tesoro",
          bankImg: "tesoro.png",
          isInsibs: true,
        },
        {
          id: "0115",
          bankName: "Banco Exterior",
          bankImg: "exterior.png",
        },
        {
          id: "0003",
          bankName: "Banco Industrial de Venezuela",
          bankImg: "banco_industrial.png",
        },
        {
          id: "0105",
          bankName: "Banco Mercantil",
          bankImg: "mercantil.png",
          isInsibs: true,
        },
        {
          id: "0191",
          bankName: "Banco Nacional de Credito",
          bankImg: "bnc.png",
        },
        {
          id: "0116",
          bankName: "Banco Occidental de Descuento",
          bankImg: "bod.png",
          isInsibs: true,
        },
        {
          id: "0138",
          bankName: "Banco Plaza",
          bankImg: "plaza.png",
        },
        {
          id: "0108",
          bankName: "Banco Provincial",
          bankImg: "provincial.png",
          isInsibs: true,
        },
        {
          id: "0134",
          bankName: "Banesco Banco Universal",
          bankImg: "banesco.png",
          isInsibs: true,
        },
        {
          id: "0151",
          bankName: "Fondo Comun",
          bankImg: "fondo_comun.png",
          isInsibs: true,
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    /**
     Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
