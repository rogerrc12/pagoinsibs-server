const express = require('express');
const router = express.Router();
const { verify } = require('../../../middleware/auth');
const { check, body } = require('express-validator/check');
// controllers
const debitsController = require('../../../controllers/client/debits');

// @route GET api/debits
// @desc get all direct debits from user
// @access Private
router.get('/', verify, debitsController.getDebits);

// @route GET api/debits/:id
// @desc get direct debit detail from debit id
// @access Private
router.get('/:id', verify, debitsController.getDebitDetail)

// @route POST api/debits
// @desc create a new direct debit from account
// @access Private
router.post(
  '/',
  [
    verify,
    [
      body('description').unescape(),
      check('account_id', 'Hay un error en el formulario (la cuenta es obligatoria).').not().isEmpty(),
      check('total_amount', 'Hay un error en el formulario (agrega un monto correcto).').isNumeric(),
      check('supplier_id', 'Hay un error en el formulario (debes seleccionar una empresa).').not().isEmpty(),
      check('start_payment_date', 'Hay un error en el formulario (debes seleccionar la fecha de inicio de tu cobro).').not().isEmpty(),
      check('product_id', 'Hay un error en el formulario (el producto es obligatorio)').not().isEmpty(),
      check('description', 'Hay un error en el formulario (la descripción es obligatoria).').not().isEmpty(),
      check('debit_type', 'Hay un error en el formulario (como serán tus pagos es obligatorio).').not().isEmpty()
    ]
  ],
  debitsController.createDebit
);

module.exports = router;