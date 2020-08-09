const express = require('express');
const router = express.Router();
const { check } = require('express-validator/check');
const { sanitizeParam } = require('express-validator/filter');
const { verify } = require('../../../middleware/auth');
// controllers
const suppliersController = require('../../../controllers/admin/suppliers');

// @route  GET admin/suppliers
// @desc   Get all suppliers
// @access Private
router.get('/', verify, suppliersController.getSuppliers);

// @route  GET admin/suppliers/profile/:id
// @desc   Get supplier profile
// @access Private
router.get('/profile/:id', verify, suppliersController.getProfile);

// @route  POST admin/suppliers
// @desc   Add a new supplier
// @access Private
router.post('/', 
  [
    verify,
    [
      sanitizeParam('address').customSanitizer(value => {
        return value.trim()
      }),
      check('name', 'Ingrese un nombre correctamente.').unescape().not().isEmpty(),
      check('rif', 'El rif solo debe contener números').isNumeric().isLength({ min: 4, max: 15 }),
      check('address', 'Ingrese una dirección correcta').unescape().not().isEmpty(),
      check('city', 'Ingrese una ciudad.').unescape().not().isEmpty(),
      check('state', 'Ingrese un estado.').unescape().not().isEmpty(),
      check('email', 'Ingrese un email.').unescape().not().isEmpty(),
      check('manager_fname', 'Ingrese un nombre correcto para la persona encargada.').unescape().not().isEmpty(),
      check('manager_lname', 'Ingrese un apellido correcto para la persona encargada.').unescape().not().isEmpty(),
      check('local_phone', 'Ingresé un número local válido.').not().isEmpty(),
      check('mobile_phone', 'Ingresé un número móvil válido.').not().isEmpty()
    ]
  ], 
  suppliersController.postSupplier
);

// @route  POST admin/suppliers/bank-account/:id
// @desc   Add a new bank account for supplier
// @access Private
router.post('/bank-account/:id', 
  [
    verify,
    [
      check('bank_id', 'El nombre del banco es obligatorio.').not().isEmpty(),
      check('acc_number', 'número de cuenta inválido').isLength({ min: 20, max: 20 }),
      check('acc_type', 'EL tipo de cuenta es obligatorio').not().isEmpty()
    ]
  ], 
  suppliersController.createSupplierAccount
);

// @route  DELETE admin/suppliers/:id
// @desc   Delete supplier and its bank accounts
// @access Private
router.delete('/:id', verify, suppliersController.deactivateSupplier);

module.exports = router;