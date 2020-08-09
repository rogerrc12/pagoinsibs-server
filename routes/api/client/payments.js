const express = require('express');
const router = express.Router();
const { verify } = require('../../../middleware/auth');
const { check, body } = require('express-validator/check');
// controllers
const paymentsController = require('../../../controllers/client/payments');

// @route  GET api/payments
// @desc   Get all payments
// @access Private
router.get('/', verify, paymentsController.getPayments);

// @route  GET api/payments/:type/:id
// @desc   Get payment by type and id
// @access Private
router.get('/:type/:id', verify, paymentsController.getPaymentDetail);

// @route  POST api/payments/account
// @desc   Make & Create a new payment
// @access Private
router.post(
  '/account',
  [
    verify,
    [
      body('description')
      .unescape(),
      check('description', 'Hay un error en el formulario (la descripción es obligatoria).')
      .not().isEmpty(),
      check('amount', 'Hay un error en el formulario (el monto es obligatorio).')
      .isCurrency()
    ]
  ],
  paymentsController.createAccPayment
);

// @route  POST api/payments/creditcard
// @desc   Make & Create a new payment
// @access Private
router.post(
  '/creditcard',
  [
    verify,
    [
      body('description')
      .unescape(),

      check('description', 'Hay un error en el formulario (la descripción es obligatoria).')
      .not().isEmpty()
      .isLength({
        max: 100
      }),
      check('amount', 'Hay un error en el formulario (el monto es obligatorio).')
      .isCurrency()
    ]
  ],
  paymentsController.createCcPayment
);

module.exports = router;