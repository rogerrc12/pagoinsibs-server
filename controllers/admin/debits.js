const { Op } = require("sequelize");
const moment = require("moment");
const Correlative = require("../../models/admin/correlative");
const BankPayment = require("../../models/admin/bankPayment");
const Debit = require("../../models/debit");
const FeeControl = require("../../models/feeControl");
const Product = require("../../models/admin/product");
const Currency = require("../../models/currency");
const User = require("../../models/user");
const Supplier = require("../../models/admin/supplier");
const Status = require("../../models/status");
const Bank = require("../../models/admin/bank");
const db = require("../../config/db");
const { addDays, addMonths } = require("../../helpers/functions");

const getDebits = async (req, res, next) => {
  const { status } = req.query;
  let debits;

  try {
    if (status === "pending") {
      debits = await Debit.findAll({
        where: {
          [Op.or]: [{ startPaymentDate: { [Op.lte]: moment().toDate() }, statusId: 1 }, { statusId: { [Op.between]: [2, 4], [Op.not]: 3 } }],
        },
        include: [{ model: User }, { model: Supplier }, { model: Status }, { model: Currency }],
      });
    } else {
      debits = await Debit.findAll({
        include: [{ model: User }, { model: Supplier }, { model: Status }, { model: Currency }],
      });
    }

    return res.status(200).json(debits);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getDebitsCount = async (req, res, next) => {
  const { status } = req.query;
  let debitsCount;

  try {
    if (status === "pending") {
      debitsCount = await Debit.findAndCountAll({
        where: {
          [Op.or]: [{ startPaymentDate: { [Op.lte]: moment().toDate() }, statusId: 1 }, { statusId: { [Op.between]: [2, 4], [Op.not]: 3 } }],
        },
      });
    } else {
      debitsCount = await Debit.findAndCountAll();
    }

    return res.status(200).json(debitsCount);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const processFeesToBank = async (debit) => {
  const { id, feeAmount, accNumber, bankName } = debit;
  const { id: userId } = debit.user;

  try {
    // GET DEBIT FEES
    const debitFees = await FeeControl.findAll({ where: { debitId: id }, include: Status });

    // CHECK IF THERE IS ANY FEE DUED, IF NOT GET THE CLOSEST PENDING TO TODAY
    let fee = debitFees.find((fee) => fee.status.name === "fallida");

    if (!fee) {
      const today = new Date();
      fee = debitFees.filter((fee) => fee.status.name === "pendiente").reduce((a, b) => (a.dueDate - today < b.dueDate - today ? a : b));
    }

    // GET BANK ID TO PROCESS
    const bank = await Bank.findOne({ where: { bankName, isInsibs: true } });

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
      const error = new Error("Existen cuotas procesando para este banco, por favor complete los pagos en proceso para crear una nueva lista.");
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

    return db.transaction(async (trx) => {
      await BankPayment.create(
        {
          amount: feeAmount,
          registerID: !lastPayment ? 1 : Number(lastPayment.registerID) + 1,
          clientAccNumber: accNumber,
          correlativeId: correlative.correlative,
          userId,
          feeId: fee.id,
          bankId: bank.id,
        },
        { transaction: trx }
      );

      await FeeControl.update({ statusId: 2 }, { where: { id: fee.id }, transaction: trx });
      await Debit.update({ statusId: 2 }, { where: { id }, transaction: trx });
    });
  } catch (error) {
    throw error;
  }
};

const processFee = async (debit) => {
  try {
    // GET DEBIT FEES
    const debitFees = await FeeControl.findAll({ where: { debitId: debit.id }, include: Status });

    // CHECK IF THERE IS ANY FEE DUED, IF NOT GET THE CLOSEST PENDING TO TODAY
    let fee = debitFees.find((fee) => fee.status.name === "fallida");

    if (!fee) {
      const today = new Date();
      fee = debitFees.filter((fee) => fee.status.name === "pendiente").reduce((a, b) => (a.dueDate - today < b.dueDate - today ? a : b));
    }

    await db.transaction(async (trx) => {
      fee.statusId = 3;
      fee.completedDate = new Date();
      await fee.save({ transaction: trx });

      if (debit.debitType === "recurrente") {
        const actualDate = new Date();
        const paymentDate = addMonths(new Date(actualDate), 1);
        const dueDate = addDays(new Date(paymentDate), 2);

        await FeeControl.create(
          {
            feeNo: Number(fee.feeNo) + 1,
            paymentDate,
            dueDate,
            statusId: 1,
            debitId: debit.id,
          },
          { transaction: trx }
        );

        await Debit.update({ startPaymentDate: paymentDate, attempts: 0 }, { where: { id: debit.id }, transaction: trx });
      } else {
        const feePaymentDate = await FeeControl.findOne({
          where: { statusId: 1, debitId: debit.id },
          attributes: ["paymentDate"],
        });

        await Debit.update(
          {
            startPaymentDate: !feePaymentDate.paymentDate ? debit.startPaymentDate : feePaymentDate.paymentDate,
            remainingAmount: Number(debit.remainingAmount) - Number(debit.feeAmount),
            remainingPayments: Number(debit.remainingPayments) - 1,
            attempts: 0,
            statusId: Number(debit.remainingPayments) - 1 === 0 ? 3 : 1,
          },
          { where: { id: debit.id }, transaction: trx }
        );
      }
    }); // END OF TRANSACION
  } catch (error) {
    throw error;
  }
};

const postDebitsToBankInBulk = async (req, res, next) => {
  try {
    const { debits } = req.body;
    const ids = debits.map((debit) => debit.id);

    const allDebits = await Debit.findAll({ where: { id: { [Op.in]: ids } }, include: User });

    if (allDebits.length > 0) {
      // CHECK IF THERE IS NOT DIFFERENT BANKS IN THE DEBITS
      let bankName = debits[0].bankName;

      for (debit of allDebits) {
        if (debit.bankName !== bankName) {
          const error = new Error("Existen bancos diferentes en el lote.");
          error.statusCode = 409;
          throw error;
        }
      }

      // PROCESS DEBITS TO BANK
      for (debit of allDebits) {
        await processFeesToBank(debit);
      }
    } else {
      const error = new Error("No existen cuotas pendientes para procesar.");
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({ message: "Cuotas procesadas correctamente." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const postDebitToBank = async (req, res, next) => {
  const { id } = req.params;

  try {
    // GET DEBIT DETAIL
    const debit = await Debit.findByPk(id, { include: User });

    if (!debit) {
      const error = new Error("No se han podido encontrar los datos de esta domiciliación.");
      error.statusCode = 404;
      throw error;
    }

    if (debit.paymentType === "account") {
      await processFeesToBank(debit);
    } else {
      await processFee(debit);
    }

    return res.json({ message: "cuota procesada correctamente." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const getDebitDetail = async (req, res, next) => {
  const { id } = req.params;

  try {
    const debit = await Debit.findByPk(id);

    const details = await Debit.findByPk(id, {
      include: [{ model: Supplier, include: [{ model: Product, where: { id: debit.productId } }] }, { model: User }, { model: Status }, { model: Currency }],
    });

    return res.status(200).json(details);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getDebitFees = async (req, res, next) => {
  const { id } = req.params;

  try {
    const fees = await FeeControl.findAll({
      where: { debitId: id },
      order: [["feeNo", "ASC"]],
      include: [{ model: Status }, { model: Debit, attributes: ["feeAmount"], include: [{ model: Currency }] }],
    });

    return res.status(200).json(fees);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const cancelDebit = async (req, res, next) => {
  const { id } = req.params;

  try {
    const debit = await Debit.findByPk(id);

    if (debit) {
      const fees = await FeeControl.findAll({ where: { debitId: debit.id } });

      for (let fee of fees) {
        if (fee.statusId !== 3) {
          fee.statusId = 6;
          await fee.save();
        }
      }

      debit.statusId = 6;
      await debit.save();

      return res.status(200).json({ message: "Domiciliación cancelada correctamente." });
    } else {
      const error = new Error("No se ha encontrado esta domiciliación. Por favor, recarga la página e intenta de nuevo");
      error.statusCode = 404;
      throw error;
    }
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getDebits,
  getDebitsCount,
  getDebitFees,
  getDebitDetail,
  postDebitToBank,
  postDebitsToBankInBulk,
  cancelDebit,
};
