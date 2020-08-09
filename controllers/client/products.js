const db = require('../../config/db');

module.exports = {
  getProduct: async id => {
    return await db('products').where({ product_id: id })
  }
}