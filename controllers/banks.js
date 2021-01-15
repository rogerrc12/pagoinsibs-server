const Bank = require("../models/admin/bank");

const getBanks = async (req, res, next) => {
  try {
    const banks = await Bank.findAll();

    return res.status(200).json(banks);
  } catch (e) {
    e.statusCode = 500;
    next(e);
  }
};

module.exports = {
  getBanks,
};
