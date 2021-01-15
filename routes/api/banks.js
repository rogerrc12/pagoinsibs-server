const express = require("express");
const router = express.Router();

// controllers
const banksController = require("../../controllers/banks");

// @route  GET api/banks
// @desc   Get all banks
// @access Private
router.get("/", banksController.getBanks);

module.exports = router;
