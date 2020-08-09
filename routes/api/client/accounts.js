const express = require('express');
const router = express.Router();
const { verify } = require('../../../middleware/auth');
const { check } = require('express-validator/check');
// controllers
const accountsController = require('../../../controllers/client/accounts');

// @route  GET api/accounts
// @desc   Get current user's accounts
// @access Private
router.get('/', verify, accountsController.getUserAccounts);

// @route  GET api/accounts/:id
// @desc   Get account to send user's info
// @access Private
router.get('/:id', verify, accountsController.getAccountById);

// @route  POST api/accounts
// @desc   Add user's bank account to send
// @access Private
router.post(
  '/',
  [
    verify,
    [
      check('acc_number', 'Hay un error en tu número de cuenta. Recordamos que deben ser 20 números.')
      .matches(/^[0-9]{20}$/),
      check('bank_id', 'Hubo un error en tu selección de banco.').not().isEmpty(),

      check('acc_type', 'Hya un error en tu selección de tipo de cuenta.').not().isEmpty(),
      check('to_receive').optional({ checkFalsy: true }).not().isEmpty()
    ]
  ],
 accountsController.addAccount
);

// @route  PUT api/accounts/:id
// @desc   update user's bank account to send
// @access Private
router.put(
  '/:id',
  [
    verify,
    [
      check('acc_number', 'Hay un error en tu número de cuenta. Recordamos que deben ser 20 números.')
      .matches(/^[0-9]{20}$/),
      check('bank_id', 'Hubo un error en tu selección de banco.').not().isEmpty(),
      check('acc_type', 'Hya un error en tu selección de tipo de cuenta.').not().isEmpty()
    ]
  ],
  accountsController.editAccount
);

// @route  DELETE api/accounts/:id
// @desc   delete user's bank account to send
// @access Private
router.delete('/:id', verify, accountsController.deleteAccount);

module.exports = router;