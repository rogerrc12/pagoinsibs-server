const Supplier = require("../../models/admin/supplier");
const Product = require("../../models/admin/product");
const Currency = require("../../models/currency");

const getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll();
    return res.status(200).json(suppliers);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getSupplierByType = async (req, res, next) => {
  const { supplier_type } = req.params;

  try {
    const suppliers = await Supplier.findAll({ where: { supplierTypeId: supplier_type, active: true }, raw: true });

    return res.status(200).json(suppliers);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getSupplierProducts = async (req, res, next) => {
  const { supplier_id } = req.params;

  try {
    const products = await Product.findAll({ where: { supplierId: supplier_id } });

    return res.status(200).json(products);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getSupplierProfile = async (req, res, next) => {
  const { id } = req.params;

  try {
    const supplier = await Supplier.findByPk(id);

    return res.status(200).json(supplier);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getProductInfo = async (req, res, next) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id, { include: [{ model: Currency }] });

    return res.status(200).json(product);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierByType,
  getSupplierProducts,
  getSupplierProfile,
  getProductInfo,
};
