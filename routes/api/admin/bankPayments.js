const multer = require("multer");
const { cloudStorage, fileFilter } = require("../../../helpers/multerConfig");
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

// @route  POST admin/bank-payments/payments
// @desc   Add payments to bank payment table in bulk
// @access Private
router.post("/payments", verify, paymentsController.postPaymentsToBankInBulk);

// @route  POST admin/bank-payments/payment/:id
// @desc   Add payment to bank payment table
// @access Private
router.post("/payment/:id", verify, paymentsController.postPaymentToBank);

// @route  POST admin/bank-payments/debits
// @desc   Add debits fees to bank payment table in bulk
// @access Private
router.post("/debits", verify, debitsController.postDebitsToBankInBulk);

// @route  POST admin/bank-payments/debit/:id
// @desc   Add debit fee to bank payment table
// @access Private
router.post("/debit/:id", verify, debitsController.postDebitToBank);

// @route  GET admin/bank-payments/create-ciser
// @desc   Create Ciser File
// @access Private
router.get("/create-ciser", verify, bankPaymentsController.generateCiserFile);

// @route  GET admin/bank-payments/process-ciser
// @desc   Process Ciser File
// @access Private
router.post(
  "/process-ciser",
  [
    verify,
    // multer({ storage: cloudStorage, fileFilter }).single('file')
  ],
  bankPaymentsController.processCiserFile
);

module.exports = router;
