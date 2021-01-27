const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
const { imageStorage } = require("../../../helpers/multerConfig");
const { check, body } = require("express-validator/check");
const multer = require("multer");
// controllers
const paymentsController = require("../../../controllers/client/payments");

// @route  GET api/payments
// @desc   Get all payments
// @access Private
router.get("/", verify, paymentsController.getPayments);

// @route  GET api/payments/:id
// @desc   Get payment by id
// @access Private
router.get("/:id", verify, paymentsController.getPaymentDetail);

// @route  POST api/payments
// @desc   Make & Create a new payment
// @access Private
router.post(
  "/",
  [
    verify,
    multer({ storage: imageStorage }).single("zelleFile"),
    [
      body("description").unescape(),
      check("description", "Hay un error en la descripción.").not().isEmpty(),
      check("amount", "Hay un error en el monto.").isDecimal(),
      check("supplierId", "Hay un error en la empresa a pagar.").not().isEmpty(),
      check("currencyId", "Hay un error en la moneda a pagar.").not().isEmpty(),
    ],
  ],
  paymentsController.createPayment
);

module.exports = router;
