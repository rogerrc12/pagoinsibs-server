const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator");
const { verify } = require("../../../middleware/auth");
// controllers
const productsController = require("../../../controllers/admin/products");

// @route  GET admin/products
// @desc   Get all products
// @access Private
router.get("/", verify, productsController.getProducts);

// @route  GET admin/products/:supplierId
// @desc   Get all products from supplier id
// @access Private
router.get("/:supplierId", verify, productsController.getProductsBySupplier);

// @route  GET admin/products/data/:id
// @desc   Get all products from product id
// @access Private
router.get("/data/:id", verify, productsController.getProductData);

// @route  POST admin/products/:supplierId
// @desc   Add a product to the supplier
// @access Private
router.post(
  "/:supplierId",
  [
    verify,
    [
      body("name").unescape(),
      check("name", "Hay un error en el formulario (revisa el nombre)").not().isEmpty(),
      check("amount", "Hay un error en el formulario (revisa el monto)").not().isEmpty(),
    ],
  ],
  productsController.addProduct
);

// @route  PUT admin/products/:productId
// @desc   edit product amount of supplier
// @access Private
router.put("/:productId", verify, productsController.editProduct);

// @route  DELETE admin/products/:productId
// @desc   delete product of supplier
// @access Private
router.delete("/:productId", verify, productsController.deleteProduct);

module.exports = router;
