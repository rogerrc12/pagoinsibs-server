const Supplier = require("../../models/admin/supplier");
const SupplierBank = require("../../models/admin/supplierBank");
const Bank = require("../../models/admin/bank");
const Debit = require("../../models/debit");
const Status = require("../../models/status");
const User = require("../../models/user");
const AccPayment = require("../../models/payment");
const CcPayment = require("../../models/payment");
const { validationResult } = require("express-validator/check");

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll({ where: { active: true } });

    return res.status(200).json(suppliers);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  const { id } = req.params;

  try {
    const profile = await Supplier.findByPk(id);
    const banks = await SupplierBank.findAll({ where: { supplierId: id }, include: Bank });

    const debits = await Debit.findAll({
      where: { supplierId: id },
      include: [
        { model: Status, attributes: ["name"], required: true },
        { model: User, attributes: ["firstName", "lastName", "cedula"], required: true },
      ],
      attributes: ["description", ["totalAmount", "amount"], "createdAt"],
    });
    const accPayments = await AccPayment.findAll({
      where: { supplierId: id },
      include: [
        { model: Status, attributes: ["name"], required: true },
        { model: User, attributes: ["firstName", "lastName", "cedula"], required: true },
      ],
      attributes: ["description", "amount", "createdAt"],
    });
    const ccPayments = await CcPayment.findAll({
      where: { supplierId: id },
      include: [
        { model: Status, attributes: ["name"], required: true },
        { model: User, attributes: ["firstName", "lastName", "cedula"], required: true },
      ],
      attributes: ["description", "amount", "createdAt"],
    });

    let payments = [];
    debits.forEach((debit) => {
      debit.setDataValue("type", "Domiciliación");
      payments.push(debit);
    });

    accPayments.forEach((accPayment) => {
      accPayment.setDataValue("type", "Pago con cuenta");
      payments.push(accPayment);
    });

    ccPayments.forEach((ccPayment) => {
      ccPayment.setDataValue("type", "Pago con tarjeta");
      payments.push(ccPayment);
    });

    return res.status(200).json({ profile, banks, payments });
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getSupplierAccount = async (req, res, next) => {
  const { accountId } = req.params;
  console.log(accountId);
};

const postSupplier = async (req, res, next) => {
  const { supplier_type, name, rif, address, city, state, manager_fname, manager_lname, local_phone, mobile_phone, email } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const supplier = await Supplier.findOne({ where: { rif: "J" + rif } });

    if (supplier) {
      const error = new Error(`EL comercio "${supplier.name}" se encuentra registrado con este RIF.`);
      error.statusCode = 409;
      next(error);
    }

    const newSupplier = {
      name: String(name).toUpperCase(),
      rif: "J" + rif,
      address: `${String(address).toUpperCase()}, ${String(city).toUpperCase()}, ${String(state).toUpperCase()}`,
      email,
      managerFirstName: String(manager_fname).toUpperCase(),
      managerLastName: String(manager_lname).toUpperCase(),
      localPhone: local_phone,
      mobilePhone: mobile_phone,
      supplierTypeId: supplier_type,
    };

    await Supplier.create(newSupplier);

    const suppliers = await Supplier.findAll();
    return res.status(200).json(suppliers);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const editSupplier = async (req, res, next) => {
  const { supplier_type, name, rif, address, city, state, manager_fname, manager_lname, local_phone, mobile_phone, email } = req.body;
  const { id } = req.params;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const supplier = await Supplier.findByPk(id);
    supplier.name = name;
    supplier.rif = "J" + rif;
    supplier.address = `${address}, ${city}, ${state.toUpperCase()}`;
    supplier.email = email;
    supplier.managerFirstName = manager_fname;
    supplier.managerLastName = manager_lname;
    supplier.localPhone = local_phone;
    supplier.mobilePhone = mobile_phone;
    await supplier.save();

    return res.status(200).json({ message: "Proveedor atualizado correctamente." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const createSupplierAccount = async (req, res, next) => {
  const { id } = req.params;
  const { bank_id, acc_number, acc_type } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const account = await SupplierBank.findOne({ where: { accNumber: acc_number } });
    if (account) {
      const error = new Error("Este número de cuenta ya se encuentra agregado.");
      error.statusCode = 409;
      throw error;
    }

    await SupplierBank.create({
      accNumber: acc_number,
      accType: acc_type,
      supplierId: id,
      bankId: bank_id,
    });

    return res.status(200).json({ message: "Cuenta agregada correctamente." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const deactivateSupplier = async (req, res, next) => {
  const { id } = req.params;

  try {
    const supplier = await Supplier.findByPk(id);
    supplier.active = false;
    await supplier.save();

    return res.status(200).json({ message: "Proveedor eliminado correctamente." });
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getProfile,
  getSupplierAccount,
  postSupplier,
  editSupplier,
  createSupplierAccount,
  deactivateSupplier,
};
