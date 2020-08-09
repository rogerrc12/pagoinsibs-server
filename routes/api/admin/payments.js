const express = require('express');
const router = express.Router();
const { verify } = require('../../../middleware/auth');
const paymentsController = require('../../../controllers/admin/payments');

// @route  GET admin/payments
// @desc   Get all users payment requests with account that are pending
// @access Private
router.get('/', verify, paymentsController.getPaymentsByStatus);

// @route  GET admin/payments/count
// @desc   Get all users payment count that are pending
// @access Private
router.get('/count', verify, paymentsController.getPaymentsCount);

// @route  GET admin/payments/:id
// @desc   Get payment details
// @access Private
router.get('/:id', verify, paymentsController.getPaymentDetails);

module.exports = router;