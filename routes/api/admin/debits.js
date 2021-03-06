const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
// controllers
const debitsController = require("../../../controllers/admin/debits");

// @route  GET admin/debits
// @desc   Get all direct debits based on status
// @access Private
router.get("/", verify, debitsController.getDebits);

// @route  GET admin/debits/count
// @desc   Get direct debits count based on status
// @access Private
router.get("/count", verify, debitsController.getDebitsCount);

// @route  GET admin/debits/:id
// @desc   Get direct debit by id
// @access Private
router.get("/:id", verify, debitsController.getDebitDetail);

// @route  GET admin/debits/fees/:id
// @desc   Get all fee for one direct debit by id
// @access Private
router.get("/fees/:id", verify, debitsController.getDebitFees);

// @route  POST admin/debits/process
// @desc   Add debits fees to bank payment table in bulk
// @access Private
router.post("/process", verify, debitsController.postDebitsToBankInBulk);

// @route  POST admin/debits/process/:id
// @desc   Add debit fee to bank payment table
// @access Private
router.post("/process/:id", verify, debitsController.postDebitToBank);

// @route  PUT admin/debits/:id
// @desc   Cancel debit to stop processing
// @access Private
router.put("/cancel/:id", verify, debitsController.cancelDebit);

module.exports = router;
