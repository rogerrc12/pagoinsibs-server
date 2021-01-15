const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
const db = require("../../../config/db");
const suppliersController = require("../../../controllers/client/suppliers");

// @route  GET api/suppliers
// @desc   Get suppliers by category
// @access Private
router.get("/", verify, suppliersController.getAllSuppliers);

// @route  GET api/suppliers/:supplier_type
// @desc   Get suppliers by category
// @access Private
router.get("/:supplier_type", verify, suppliersController.getSupplierByType);

// @route  GET api/suppliers/profile/:id
// @desc   Get supplier profile
// @access Private
router.get("/profile/:id", verify, suppliersController.getSupplierProfile);

// @route  GET api/suppliers/products/:supplier_id
// @desc   Get supplier products
// @access Private
router.get("/products/:supplier_id", verify, suppliersController.getSupplierProducts);

// @route  GET api/suppliers/products/info/:id
// @desc   Get supplier products
// @access Private
router.get("/products/info/:id", verify, suppliersController.getProductInfo);

module.exports = router;
