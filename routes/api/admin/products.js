const express = require('express');
const router = express.Router();
const { check, body } = require('express-validator/check');
const { verify } = require('../../../middleware/auth');
// controllers
const productsController = require('../../../controllers/admin/products');

// @route  GET admin/products/:supplier_id
// @desc   Get all products from supplier id
// @access Private
router.get('/:supplier_id', verify, productsController.getProducts);

// @route  GET admin/products/data/:id
// @desc   Get all products from product id
// @access Private
router.get('/data/:id', verify, productsController.getProductData);

// @route  POST admin/products/:supplier_id
// @desc   Add a product to the supplier
// @access Private
router.post('/:supplier_id', 
  [
    verify,
    [
      body('product_name').unescape(),
      check('product_name', 'Hay un error en el formulario (revisa el nombre)').not().isEmpty(),
      check('product_amount', 'Hay un error en el formulario (revisa el monto)').not().isEmpty()
    ]
  ],
  productsController.addProduct
);

// @route  PUT admin/products/:product_id
// @desc   edit product amount of supplier
// @access Private
router.put('/:supplier_id/:product_id', verify, productsController.editProduct );

// @route  DELETE admin/products/:product_id
// @desc   delete product of supplier
// @access Private
router.delete('/:supplier_id/:product_id', verify, productsController.deleteProduct );


module.exports = router;