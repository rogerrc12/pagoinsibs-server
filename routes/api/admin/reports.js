const express = require('express');
const router = express.Router();
const { check } = require('express-validator/check');
const { verify } = require('../../../middleware/auth');

// CONTROLLER
const reportController = require('../../../controllers/admin/reports');

// @route  POST admin/reports/:report_type
// @desc   Generate report based on selection
// @access Private
router.post('/:report_type', 
[
    verify,
    [
        check('fromDate', 'Debe seleccionar una fecha de inicio.').not().isEmpty(),
        check('toDate', 'Debe seleccionar una fecha final.').not().isEmpty()
    ]
], 
reportController.createReport);

module.exports = router;