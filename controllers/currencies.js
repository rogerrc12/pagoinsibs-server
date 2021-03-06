const Currency = require("../models/currency");
const { validationResult } = require("express-validator/check");

const getCurrencies = async (req, res, next) => {
  try {
    const currencies = await Currency.findAll();

    return res.status(200).json(currencies);
  } catch (e) {
    e.statusCode = 500;
    next(e);
  }
};

const getCurrencyData = async (req, res, next) => {
  const { currencyId } = req.params;

  try {
    const currencyData = await Currency.findByPk(currencyId);

    return res.status(200).json(currencyData);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const editCurrency = async (req, res, next) => {
  const { currencyId } = req.params;
  const { name, symbol, buyPrice, sellPrice } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }
    const currency = await Currency.findByPk(currencyId);

    currency.name = name;
    currency.symbol = symbol;
    currency.buyPrice = buyPrice;
    currency.sellPrice = sellPrice;
    await currency.save();
    return res.status(200).send("Moneda guardada correctamente.");
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getCurrencies,
  getCurrencyData,
  editCurrency,
};
