const { storage, fileFilter } = require("../../../helpers/multerConfig");
const multer = require("multer");
const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
// controllers
const bankPaymentsController = require("../../../controllers/admin/bankPayments");
const debitsController = require("../../../controllers/admin/debits");
const paymentsController = require("../../../controllers/admin/payments");

// @route  GET admin/bank-payments?bank_name=?
// @desc   Get bank payments by bank name
// @access Private
router.get("/", verify, bankPaymentsController.getBankPayments);

// @route  GET admin/bank-payments/create-ciser
// @desc   Create Ciser File
// @access Private
router.get("/create-ciser", verify, bankPaymentsController.generateCiserFile);

// @route  GET admin/bank-payments/process-ciser
// @desc   Process Ciser File
// @access Private
router.post("/process-ciser", [verify, multer({ storage, fileFilter }).single("file")], bankPaymentsController.processCiserFile);

module.exports = router;
