const Account = require("../../models/account");
const User = require("../../models/user");
const Bank = require("../../models/admin/bank");
const { validationResult } = require("express-validator");
const mail = require("../../mail/config");

const getUserAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.findAll({ include: Bank, where: { userId: req.user.id } });

    return res.status(200).json(accounts);
  } catch (e) {
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  }
};

const getAccountById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const account = await Account.findByPk(id, { include: Bank });
    return res.status(200).json(account);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const addAccount = async (req, res, next) => {
  const { acc_number, bank_id, acc_type } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      const error = new Error("Este usuario no se encuentra validado para realizar esta acción. Por favor contacte a soporte.");
      error.statusCode = 409;
      throw error;
    }

    let accounts = await Account.findAll({ where: { userId: req.user.id }, raw: true });
    if (accounts.length === 4) {
      const error = new Error("Ya ha agregado el máximo de 4 cuentas, debe eliminar para agregar una nueva.");
      error.statusCode = 409;
      throw error;
    }

    const newAccount = {
      accNumber: acc_number,
      accType: acc_type,
      toSend: true,
      bankId: bank_id,
      userId: req.user.id,
    };

    const createdAccount = await Account.create(newAccount, { include: Bank });
    accounts = await Account.findAll({ where: { userId: req.user.id }, include: Bank });
    const bank = await Bank.findByPk(createdAccount.bankId);

    res.json(accounts);

    const options = {
      email: req.user.email,
      subject: "Has agregado una nueva cuenta",
      template: "added_account",
      variables: JSON.stringify({
        name: req.user.name,
        acc_category: "pagar",
        acc_number,
        bank_name: bank.bankName,
        acc_type,
      }),
    };

    return await mail.send(options);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const editAccount = async (req, res, next) => {
  const { acc_number, bank_id, acc_type } = req.body;
  const { id } = req.params;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      const error = new Error("Este usuario no se encuentra validado para realizar esta acción. Por favor contacte a soporte.");
      error.statusCode = 409;
      throw error;
    }

    await Account.update({ accNumber: acc_number, accType: acc_type, bankId: bank_id }, { where: { id } });
    const accounts = await Account.findAll({ where: { userId: req.user.id }, include: Bank });

    return res.status(200).json(accounts);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    const account = await Account.findByPk(id);
    if (!account) {
      const error = new Error("Esta cuenta ya no está agregada. Por favor recargue el sitio.");
      error.statusCode = 404;
      throw error;
    }

    await account.destroy();
    const accounts = await Account.findAll({ where: { userId: req.user.id }, include: Bank });

    return res.status(200).json(accounts);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getUserAccounts,
  getAccountById,
  addAccount,
  editAccount,
  deleteAccount,
};
