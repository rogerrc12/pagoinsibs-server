const { Op } = require("sequelize");
const { validationResult } = require("express-validator/check");
const AdminUser = require("../../models/admin/adminUser");
const Role = require("../../models/admin/role");
const bcrypt = require("bcryptjs");

const getUsers = async (req, res, next) => {
  try {
    const users = await AdminUser.findAll({ include: Role, where: { [Op.not]: { roleId: 1 } }, attributes: ["id", "firstName", "lastName", "cedula", "email", "createdAt"] });

    return res.status(200).json(users);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await AdminUser.findByPk(id);

    return res.status(200).json(user);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const createUser = async (req, res, next) => {
  const { first_name, last_name, cedula, email, password, role_id } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const hash = await bcrypt.hash(password, 12);

    await AdminUser.create({
      firstName: first_name,
      lastName: last_name,
      cedula,
      email,
      hash,
      roleId: role_id,
    });

    return res.status(200).json({ message: "Usuario creado correctamente!" });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const editUser = async (req, res, next) => {
  const { id } = req.params;
  const { first_name, last_name, email, role_id, password, ci_number, ci_type } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const user = await AdminUser.findByPk(id);
    if (!user) {
      const error = new Error("No se ha encontrado el usuario a editar, por favor intenta con otro.");
      error.statusCode = 404;
      throw error;
    }

    // check if passwords are the same
    let hash;
    const isMatch = await bcrypt.compare(password, user.hash);

    if (!isMatch) {
      const salt = await bcrypt.genSalt(12);
      hash = await bcrypt.hash(password, salt);
    } else {
      hash = user.hash;
    }

    user.firstName = first_name;
    user.lastName = last_name;
    user.cedula = ci_type + ci_number;
    user.email = email;
    user.roleId = role_id;
    user.hash = hash;

    await user.save();

    return res.status(200).json({ message: "Usuario actualizado correctamente." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await AdminUser.findByPk(id);
    if (!user) {
      const error = new Error("No se ha encontrado el usuario a editar, por favor intenta con otro.");
      error.statusCode = 404;
      throw error;
    }

    await user.destroy();

    return res.status(200).json({ message: "El usuario ha sido eliminado." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserProfile,
  createUser,
  editUser,
  deleteUser,
};
