const db = require("../../config/db");
const moment = require("moment");
const Payments = require("../../models/payment");
const User = require("../../models/user");
const Supplier = require("../../models/admin/supplier");
const Status = require("../../models/status");
const Bank = require("../../models/admin/bank");
const Currency = require("../../models/currency");
const Correlative = require("../../models/admin/correlative");
const BankPayment = require("../../models/admin/bankPayment");
const { Op } = require("sequelize");

const getPaymentsCount = async (req, res, next) => {
  const { status } = req.query;
  let paymentsCount;

  try {
    if (status === "pending") {
      paymentsCount = await Payments.findAndCountAll({
        where: {
          [Op.or]: [{ startPaymentDate: { [Op.lte]: moment().toDate() }, statusId: 1 }, { statusId: { [Op.between]: [2, 4], [Op.not]: 3 } }],
        },
      });
    } else {
      paymentsCount = await Payments.findAndCountAll();
    }

    return res.status(200).json(paymentsCount);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getPaymentsByStatus = async (req, res, next) => {
  const { status } = req.query;
  let payments;

  try {
    if (status === "pending") {
      payments = await Payments.findAll({
        where: {
          [Op.or]: [{ startPaymentDate: { [Op.lte]: moment().toDate() }, statusId: 1 }, { statusId: { [Op.between]: [2, 4], [Op.not]: 3 } }],
        },
        include: [{ model: Supplier }, { model: User }, { model: Status }, { model: Currency }],
      });
    } else {
      payments = await Payments.findAll({
        include: [{ model: Supplier }, { model: User }, { model: Status }, { model: Currency }],
      });
    }

    return res.status(200).json(payments);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const getPaymentDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const payment = await Payments.findByPk(id, {
      include: [{ model: User }, { model: Supplier }, { model: Status }, { model: Currency }],
    });

    return res.status(200).json(payment);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const processPaymentToBank = async (payment) => {
  const { id, amount, accNumber, bankName } = payment;
  const { id: userId } = payment.user;

  try {
    // GET BANK ID TO PROCESS
    const bank = await Bank.findOne({ where: { bankName } });

    if (!bank.id) {
      const error = new Error("Este banco no se encuentra reigstrado para procesar pagos");
      error.statusCode = 409;
      throw error;
    }

    // CHECK IF THERE IS ANY CORRELATIVE PROCESSED ACTIVE
    const correlativeProcessed = await Correlative.findOne({
      where: { processed: true },
      include: { model: BankPayment, where: { bankId: bank.id } },
    });

    if (correlativeProcessed) {
      const error = new Error("Existen cuotas procesandose para este banco, por favor complete los pagos en proceso para crear una nueva lista.");
      error.statusCode = 409;
      throw error;
    }

    // GET CORRELATIVE BASED ON BANK
    let correlative = await Correlative.findOne({
      where: { processed: false },
      include: [{ model: BankPayment, where: { bankId: bank.id } }],
    });

    if (!correlative) {
      correlative = await Correlative.create({ processed: false });
    }

    const bankPayments = await BankPayment.findAll({ where: { bankId: bank.id } });
    const lastPayment = bankPayments[bankPayments.length - 1];

    const newPaymentToProcess = {
      amount,
      registerID: !lastPayment ? 1 : Number(lastPayment.registerID) + 1,
      clientAccNumber: accNumber,
      correlativeId: correlative.correlative,
      userId,
      paymentId: id,
      bankId: bank.id,
    };

    return await db.transaction(async (trx) => {
      await BankPayment.create(newPaymentToProcess, { transaction: trx });
      await Payments.update({ statusId: 2 }, { where: { id }, transaction: trx });
    });
  } catch (error) {
    throw error;
  }
};

const postPaymentToBank = async function (req, res, next) {
  const { id } = req.params;

  try {
    // get payment details by id
    const payment = await Payments.findByPk(id, { include: User });
    // check if payment detail was obtained
    if (!payment) {
      const error = new Error("No se han podido encontrar los datos de este pago.");
      error.statusCode = 404;
      throw error;
    }
    // check if payment is any other status than pending
    if (payment.statusId !== 1) {
      const error = new Error("Al parecer este pago ya ha sido enviado para procesarse.");
      error.statusCode = 409;
      throw error;
    }

    if (payment.paymentType === "account") {
      await processPaymentToBank(payment);
    } else {
      payment.statusId = 3;
      await payment.save();
    }

    return res.status(200).json({ message: "Pago procesado correctamente." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const postPaymentsToBankInBulk = async (req, res, next) => {
  try {
    const { payments } = req.body;

    const ids = payments.map((payment) => payment.id);

    const allPayments = await Payments.findAll({ where: { id: { [Op.in]: ids } }, include: User });

    // CHECK IF BANKS OF PAYMENTS ARE THE SAME
    if (allPayments.length > 0) {
      const bankName = payments[0].bankName;

      for (payment of allPayments) {
        if (payment.bankName !== bankName) {
          const error = new Error("Existen pagos con bancos diferentes en el lote.");
          error.statusCode = 409;
          throw error;
        }
      }

      // PROCESS PAYMENTS TO BANK
      for (payment of allPayments) {
        await processPaymentToBank(payment);
      }
    } else {
      const error = new Error("No existen pagos pendientes para procesar.");
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({ message: "Pagos procesados correctamente" });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const cancelPayment = async (req, res, next) => {
  const { id } = req.params;

  try {
    const payment = await Payments.findByPk(id);

    // check if payment detail was obtained
    if (!payment) {
      const error = new Error("No se han podido encontrar los datos de este pago.");
      error.statusCode = 404;
      throw error;
    }

    payment.statusId = 6;
    await payment.save();

    return res.status(200).json({ message: "Pago cancelado correctamente" });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getPaymentsCount,
  getPaymentsByStatus,
  postPaymentToBank,
  getPaymentDetails,
  postPaymentsToBankInBulk,
  cancelPayment,
};
