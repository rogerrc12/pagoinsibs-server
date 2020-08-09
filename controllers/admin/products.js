const Product = require('../../models/admin/product');
const { validationResult } = require('express-validator/check'); 

const getProducts = async (req, res, next) => {
  const { supplier_id } = req.params;
  
  try {
    const products = await Product.findAll({ where: {supplierId: supplier_id} });
    
    return res.status(200).json(products);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
}

const getProductData = async (req, res, next) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);
    
    return res.status(200).json(product);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
}

const addProduct = async (req, res, next) => {
  const { supplier_id } = req.params;
  const { product_name, product_amount, interest_rate, debit_months } = req.body;
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }
    
    await Product.create({ 
      name: product_name, 
      amount: product_amount, 
      interestRate: interest_rate,
      maxDebitMonths: debit_months,
      supplierId: supplier_id 
    });
    
    return res.status(200).json({ message: 'Producto agregado correctamente!' });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
}

const editProduct = async (req, res, next) => {
  const { supplier_id, product_id } = req.params;
  const { product_amount, debit_months, interest_rate, product_name } = req.body;

  
  try {
    const product = await Product.findByPk(product_id, { where: { supplierId: supplier_id } });
    
    if (!product) {
      const error = new Error('No se ha encontrado el producto, por favor recarga la página e intenta de nuevo. Si el problema persiste contacta a soporte.');
      error.statusCode = 404;
      throw error;
    }
    
    product.amount = product_amount;
    product.interestRate = interest_rate;
    product.maxDebitMonths = debit_months;
    product.name = product_name;
    
    await product.save();
    
    return res.status(200).json({ message: 'Producto actualizado correctamente!' });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
}

const deleteProduct = async (req, res, next) => {
  const { supplier_id, product_id } = req.params;
  
  try {
    await Product.destroy({ where: { id: product_id, supplierId: supplier_id } });
    
    return res.status(200).json({ message: 'Producto eliminado correctamente.' });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductData,
  addProduct,
  editProduct,
  deleteProduct
}