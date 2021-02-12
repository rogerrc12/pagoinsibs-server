const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
const { check, body } = require("express-validator/check");
// controllers
const debitsController = require("../../../controllers/client/debits");

// @route GET api/debits
// @desc get all direct debits from user
// @access Private
router.get("/", verify, debitsController.getDebits);

// @route GET api/debits/:id
// @desc get direct debit detail from debit id
// @access Private
router.get("/:id", verify, debitsController.getDebitDetail);

// @route POST api/debits
// @desc create a new direct debit from account
// @access Private
router.post(
  "/",
  [
    verify,
    [
      body("description").unescape(),
      check("description", "Hay un error en la descripción.").not().isEmpty(),
      check("supplierId", "Hay un error en la empresa a pagar.").not().isEmpty(),
      check("currencyId", "Hay un error en la moneda a pagar.").not().isEmpty(),
      check("amount", "Hay un error en el formulario (agrega un monto correcto).").isNumeric(),
      check("startPaymentDate", "Hay un error en el formulario (debes seleccionar la fecha de inicio de tu cobro).").not().isEmpty(),
      check("productId", "Hay un error en el formulario (el producto es obligatorio)").not().isEmpty(),
      check("debitType", "Hay un error en el formulario (como serán tus pagos es obligatorio).").not().isEmpty(),
    ],
  ],
  debitsController.createDebit
);

module.exports = router;
