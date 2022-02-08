const Debit = require("../../models/debit");
const FeeControl = require("../../models/feeControl");
const Payment = require("../../models/payment");
const Bank = require("../../models/admin/bank");
const User = require("../../models/user");
const Supplier = require("../../models/admin/supplier");
const Currency = require("../../models/currency");
const reports = require("../../helpers/excelFiles");
const { Op } = require("sequelize");
const moment = require("moment");
const { validationResult } = require("express-validator");

const createReport = async (req, res, next) => {
  const { fromDate, toDate, bankId, supplierId, currencyId } = req.body;

  const { report_type } = req.params;
  const errors = validationResult(req);

  const startDate = moment(fromDate);
  const endDate = moment(toDate);

  try {
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    let workbook, bank, fileName, fees, payments;
    switch (report_type) {
      case "pending":
        fees = await FeeControl.findAll({
          where: {
            statusId: 1,
            paymentDate: { [Op.between]: [fromDate, toDate] },
          },
          include: [
            {
              model: Debit,
              where: { statusId: 1, currencyId },
              include: [
                { model: User, attributes: ["firstName", "lastName", "cedula"] },
                { model: Supplier, attributes: ["name", "rif"] },
                { model: Currency, attributes: ["name", "symbol"] },
              ],
            },
          ],
          order: [["paymentDate", "DESC"]],
        });

        payments = await Payment.findAll({
          where: {
            statusId: 1,
            startPaymentDate: {
              [Op.between]: [startDate, endDate],
            },
            currencyId,
          },
          include: [
            { model: User, attributes: ["firstName", "lastName", "cedula"] },
            { model: Supplier, attributes: ["name", "rif"] },
            { model: Currency, attributes: ["name", "symbol"] },
          ],
          order: [["startPaymentDate", "DESC"]],
        });

        if (fees.length === 0 && payments.length === 0) {
          const error = new Error("No se encontraron entradas en este rango de fecha.");
          error.statusCode = 404;
          throw error;
        }

        workbook = reports.createPendingReport(fees, payments, currencyId);
        fileName = `Cuotas pendientes por cobrar general desde ${moment(startDate).format("DD-MM-YYYY")} hasta ${moment(endDate).format("DD-MM-YYYY")}.xlsx`;
        break;
      case "pending-bank":
        bank = await Bank.findByPk(bankId);

        fees = await FeeControl.findAll({
          where: {
            statusId: 1,
            paymentDate: { [Op.between]: [fromDate, toDate] },
          },
          include: [
            {
              model: Debit,
              where: { bankName: bank.bankName, statusId: 1, currencyId },
              include: [
                { model: User, attributes: ["firstName", "lastName", "cedula"] },
                { model: Supplier, attributes: ["name", "rif"] },
                { model: Currency, attributes: ["name", "symbol"] },
              ],
            },
          ],
          order: [["paymentDate", "DESC"]],
        });

        payments = await Payment.findAll({
          where: {
            statusId: 1,
            bankName: bank.bankName,
            startPaymentDate: {
              [Op.between]: [startDate, endDate],
            },
            currencyId,
          },
          include: [
            { model: User, attributes: ["firstName", "lastName", "cedula"] },
            { model: Supplier, attributes: ["name", "rif"] },
            { model: Currency, attributes: ["name", "symbol"] },
          ],
          order: [["startPaymentDate", "DESC"]],
        });

        if (fees.length === 0 && payments.length === 0) {
          const error = new Error("No se encontraron entradas en este rango de fecha.");
          error.statusCode = 404;
          throw error;
        }

        workbook = reports.createPendingReport(fees, payments, currencyId);
        fileName = `Cuotas pendientes por cobrar para ${bank.bankName} desde ${moment(startDate).format("DD-MM-YYYY")} hasta ${moment(endDate).format("DD-MM-YYYY")}.xlsx`;
        break;
      case "pending-supplier":
        const supplier = await Supplier.findByPk(supplierId);

        fees = await FeeControl.findAll({
          where: {
            statusId: 1,
            paymentDate: { [Op.between]: [fromDate, toDate] },
          },
          include: [
            {
              model: Debit,
              where: { supplierId, statusId: 1, currencyId },
              include: [
                { model: User, attributes: ["firstName", "lastName", "cedula"] },
                { model: Supplier, attributes: ["name", "rif"] },
                { model: Currency, attributes: ["name", "symbol"] },
              ],
            },
          ],
          order: [["paymentDate", "DESC"]],
        });

        payments = await Payment.findAll({
          where: {
            supplierId,
            startPaymentDate: {
              [Op.between]: [startDate, endDate],
            },
            currencyId,
          },
          include: [
            { model: User, attributes: ["firstName", "lastName", "cedula"] },
            { model: Supplier, attributes: ["name", "rif"] },
            { model: Currency, attributes: ["name", "symbol"] },
          ],
          order: [["startPaymentDate", "DESC"]],
        });

        if (fees.length === 0 && payments.length === 0) {
          const error = new Error("No se encontraron entradas en este rango de fecha.");
          error.statusCode = 404;
          throw error;
        }

        workbook = reports.createPendingReport(fees, payments, currencyId);
        fileName = `Cuotas pendientes por cobrar para ${supplier.name} desde ${moment(startDate).format("DD-MM-YYYY")} hasta ${moment(endDate).format("DD-MM-YYYY")}.xlsx`;
        break;
      case "expired-payments":
        debits = await Debit.findAll({
          where: {
            statusId: 5,
            startPaymentDate: {
              [Op.between]: [startDate, endDate],
            },
            currencyId,
          },
          include: [
            { model: Supplier, attributes: ["name", "rif"] },
            { model: User, attributes: ["firstName", "lastName", "cedula", "email", "phone"] },
            { model: Currency, attributes: ["name", "symbol"] },
          ],
        });

        payments = await Payment.findAll({
          where: {
            statusId: 5,
            startPaymentDate: {
              [Op.between]: [startDate, endDate],
            },
            currencyId,
          },
          include: [
            { model: Supplier, attributes: ["name", "rif"] },
            { model: User, attributes: ["firstName", "lastName", "cedula", "email", "phone"] },
            { model: Currency, attributes: ["name", "symbol"] },
          ],
        });

        if (debits.length === 0 && payments.length === 0) {
          const error = new Error("No se encontraron entradas en este rango de fecha.");
          error.statusCode = 404;
          throw error;
        }

        workbook = reports.createExpiredReport(debits, payments, currencyId);
        fileName = `Cuotas vencidas desde ${moment(startDate).format("DD-MM-YYYY")} hasta ${moment(endDate).format("DD-MM-YYYY")}.xlsx`;
        break;
      case "charged-payments":
        bank = await Bank.findByPk(bankId);

        debits = await FeeControl.findAll({
          where: {
            statusId: 3,
          },
          include: [
            {
              model: Debit,
              where: { bankName: bank.bankName },
              include: [
                { model: Supplier, attributes: ["name", "rif"] },
                { model: User, attributes: ["firstName", "lastName", "cedula"] },
              ],
            },
          ],
        });

        payments = await Payment.findAll({
          where: {
            statusId: 3,
            bankName: bank.bankName,
          },
          include: [
            { model: Supplier, attributes: ["name", "rif"] },
            { model: User, attributes: ["firstName", "lastName", "cedula"] },
          ],
        });

        console.log(debits, payments);

        workbook = reports.createChargedReport(debits, payments);
        fileName = `Cuotas cobradas para ${bank.bankName} desde ${moment(startDate).format("DD-MM-YYYY")} hasta ${moment(endDate).format("DD-MM-YYYY")}.xlsx`;

        break;
      default:
        return null;
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("X-Suggested-Filename", fileName);
    await workbook.xlsx.write(res);

    return res.status(200).end();
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  createReport,
};
