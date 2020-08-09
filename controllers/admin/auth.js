const AdminUser = require('../../models/admin/adminUser');
const Role = require('../../models/admin/role');
const bcrypt = require('bcryptjs');
const { signAdmin } = require('../../middleware/auth');
const { validationResult } = require('express-validator/check');

const getData = async (req, res, next) => {
  try {
    const user = await AdminUser.findByPk(req.user.id, { include: Role });
    return res.status(200).json(user);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
}

const login = async (req, res, next) => {
  const { email, password } = req.body
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }
    
    const user = await AdminUser.findOne({ where: {email} });
    if (!user) {
      const error = new Error('usuario y/o contraseña incorrectos');
      error.statusCode = 404;
      throw error;
    }
    
    const isMatch =  await bcrypt.compare(password, user.hash);
    if (!isMatch) {
      const error = new Error('usuario y/o contraseña incorrectos');
      error.statusCode = 404;
      throw error;
    }
    
    const payload = {
      user: {
        id: user.id,
        name: user.firstName + ' ' + user.lastName,
        cedula: user.cedula,
        email: user.email
      }
    }
    
    const token = { token: signAdmin(payload) };
    return res.status(200).json(token);
    
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
}

module.exports = {
  getData,
  login
}
