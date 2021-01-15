const Product = require("../../models/admin/product");
const Supplier = require("../../models/admin/supplier");
const Currency = require("../../models/currency");
const { validationResult } = require("express-validator/check");

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({ include: [{ model: Currency }, { model: Supplier }] });
    let productsData = {
      onePaymentProducts: [],
      directDebitProducts: [],
    };

    if (products.length > 0) {
      productsData = {
        onePaymentProducts: products.filter((product) => !product.isDirectDebit),
        directDebitProducts: products.filter((product) => product.isDirectDebit),
      };
    }

    return res.status(200).json(productsData);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getProductsBySupplier = async (req, res, next) => {
  const { supplierId } = req.params;

  try {
    const products = await Product.findAll({ where: { supplierId }, include: [{ model: Currency }] });

    return res.status(200).json(products);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getProductData = async (req, res, next) => {
  const { id } = req.params;

  try {
    const product = await Product.findOne({ where: { id }, include: [{ model: Currency }] });
    return res.status(200).json(product);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const addProduct = async (req, res, next) => {
  const { supplierId } = req.params;
  const { name, amount, interestRate, maxDebitMonths, isDirectDebit, currencyConversion, currencyId } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    await Product.create({
      name,
      amount,
      interestRate: interestRate || null,
      maxDebitMonths: +maxDebitMonths || null,
      isDirectDebit,
      supplierId,
      currencyId,
      currencyConversion,
    });

    return res.status(200).json({ message: "Producto agregado correctamente!" });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const editProduct = async (req, res, next) => {
  const { productId } = req.params;
  const { amount, maxDebitMonths, interestRate, name, currencyId, isDirectDebit } = req.body;

  try {
    const product = await Product.findByPk(productId);

    if (!product) {
      const error = new Error(
        "No se ha encontrado el producto, por favor recarga la página e intenta de nuevo. Si el problema persiste contacta a soporte."
      );
      error.statusCode = 404;
      throw error;
    }

    product.amount = amount;
    product.isDirectDebit = isDirectDebit;
    product.interestRate = interestRate || null;
    product.maxDebitMonths = maxDebitMonths || null;
    product.name = name;
    product.currencyId = currencyId;

    await product.save();

    return res.status(200).json({ message: "Producto actualizado correctamente!" });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  const { supplierId, productId } = req.params;

  try {
    await Product.destroy({ where: { id: productId, supplierId } });

    return res.status(200).json({ message: "Producto eliminado correctamente." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductsBySupplier,
  getProductData,
  addProduct,
  editProduct,
  deleteProduct,
};
