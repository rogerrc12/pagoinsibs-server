const express = require("express");
const router = express.Router();
const { verify } = require("../../middleware/auth");
const { check } = require("express-validator/check");

// controllers
const currencyControllers = require("../../controllers/currencies");

// @route  GET api/currencies
// @desc   Get all currencies
// @access Private
router.get("/", verify, currencyControllers.getCurrencies);

// @route  GET api/currencies/:currencyId
// @desc   Get currency data
// @access Private
router.get("/:currencyId", verify, currencyControllers.getCurrencyData);

// @route  PUT api/currencies/:currencyId
// @desc   Edit currency
// @access Private
router.put(
  "/:currencyId",
  [
    verify,
    [
      check("name", "Error en el nombre.").not().isEmpty(),
      check("symbol", "Error en el simbolo.").not().isEmpty(),
      check("buyPrice", "Error en el precio de compra.").isDecimal(),
      check("sellPrice", "Error en el precio de venta.").isDecimal(),
    ],
  ],
  currencyControllers.editCurrency
);

module.exports = router;
