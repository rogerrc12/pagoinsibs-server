const db = require("../../config/db");
const fs = require("fs");
const { Op } = require("sequelize");
const BankPayment = require("../../models/admin/bankPayment");
const Correlative = require("../../models/admin/correlative");
const User = require("../../models/user");
const Bank = require("../../models/admin/bank");
const FeeControl = require("../../models/feeControl");
const Debit = require("../../models/debit");
const AccPayment = require("../../models/accPayment");
const readExcel = require("read-excel-file/node");
const { addDays, addMonths } = require("../../helpers/functions");
const { generateSiserFile } = require("../../helpers/excelFiles");
const AWS = require("aws-sdk");
const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const getBankPayments = async (req, res, next) => {
  const { bank_id } = req.query;

  try {
    const payments = await BankPayment.findAll({
      where: { bankId: bank_id },
      include: [{ model: Correlative }, { model: User }],
      order: [["registerID", "ASC"]],
    });

    return res.status(200).json(payments);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const generateCiserFile = async (req, res, next) => {
  try {
    const { bank_id } = req.query;
    const bank = await Bank.findByPk(bank_id);

    // CHECK IF BANK_ID EXISTS
    if (!bank) {
      const error = new Error("No se ha encontrado el banco destino para poder generar el archivo.");
      error.statusCode = 404;
      throw error;
    }

    // GET USER DEBITS
    const debits = await BankPayment.findAll({
      where: { bankId: bank_id, paymentId: null },
      include: [{ model: User }, { model: FeeControl, as: "fee", include: Debit }],
      order: [["registerID", "ASC"]],
    });

    const payments = await BankPayment.findAll({
      where: { bankId: bank_id, feeId: null },
      include: [{ model: User }, { model: AccPayment, as: "payment" }],
      order: [["registerID", "ASC"]],
    });

    if (debits.length === 0 && payments.length === 0) {
      const error = new Error("No existen pagos o domiciliaciones para procesar.");
      error.statusCode = 404;
      throw error;
    }

    let correlative;
    if (debits.length > 0) {
      correlative = debits[0].correlativeId;
    } else {
      correlative = payments[0].correlativeId;
    }

    // CREATE EXCEL FILE
    const workbook = generateSiserFile(correlative, debits, payments);

    // SAVE EXCEL FILE IN FOLDER
    const fileName = `ciser_#${correlative}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("X-Suggested-Filename", fileName);
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

    await workbook.xlsx.write(res);
    await updateSiserCorrelative(correlative);

    return res.status(200).end();
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const updateSiserCorrelative = async (correlative) => {
  try {
    await Correlative.update({ processed: true }, { where: { correlative } });
  } catch (error) {
    throw error;
  }
};

const processCiserFile = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error(
        "El archivo usado no es el correcto. Por favor utiliza un archivo con formato .xlsx e intenta de nuevo."
      );
      error.statusCode = 404;
      throw error;
    }

    const { path } = req.file;

    // CONVERT EXCEL FILE INTO AN ARRAY OF OBJECTS
    const file = await readExcel(fs.createReadStream(path));

    const fileArray = [...file];
    const fileKeys = [...file[0]];
    fileArray.shift();

    let fileData = [];

    fileArray.map((item) => {
      const object = item.reduce((result, field, i) => {
        let key = fileKeys[i]
          .normalize("NFKD")
          .replace(/[\u0300-\u036F]/g, "")
          .replace(/\s+/g, "");
        result[key] = field;
        return result;
      }, {});
      fileData.push(object);
    });

    // UPDATE PAYMENTS AND DEBITS STATUS FROM FILE DATA
    const payments = await updatePaymentStatusFromSiser(fileData);
    const debits = await updateDebitStatusFromSiser(fileData);

    if (!payments && !debits) {
      const error = new Error(
        "No hay ningun pago para ser procesado en este lote. Revisa el archivo o intenta con" + " otro."
      );
      error.statusCode = 404;
      throw error;
    }

    if (payments) {
      await deleteProcessedPayments(payments);
    }

    if (debits) {
      await deleteProcessedPayments(debits);
    }

    // await deleteFileGcStorage(filename);
    return res.status(200).json({ message: "Todos los pagos fueron procesados y actualizados." });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const updatePaymentStatusFromSiser = async (data) => {
  try {
    const payments = await BankPayment.findAll({ where: { correlativeId: data[0].NumeroLote, feeId: null } });

    if (payments.length === 0) return null;

    for (let i = 0; i < payments.length; i++) {
      const { paymentId } = payments[i];
      const payment = await AccPayment.findByPk(paymentId);

      if (data[i].Estado.toLowerCase() === "pagado") {
        await AccPayment.update({ statusId: 3, endPaymentDate: data[i].FechaPago }, { where: { id: paymentId } });
      } else {
        const newAttempts = payment.attempts - 1;
        await AccPayment.update(
          {
            statusId: newAttempts === 0 ? 5 : 4,
            attempts: newAttempts,
          },
          { where: { id: paymentId } }
        );
      }
    }

    return payments;
  } catch (error) {
    throw error;
  }
};

const updateDebitStatusFromSiser = async (data) => {
  try {
    const debitPayments = await BankPayment.findAll({ where: { correlativeId: data[0].NumeroLote, paymentId: null } });

    if (debitPayments.length === 0) return null;

    for (let i = 0; i < debitPayments.length; i++) {
      const { feeId } = debitPayments[i];

      let fee = await FeeControl.findByPk(feeId, { include: Debit });

      if (data[i].Estado.toLowerCase() === "pagado") {
        await db.transaction(async (trx) => {
          fee.statusId = 3;
          fee.completedDate = new Date();
          await fee.save({ transaction: trx });

          if (fee.debit.debitType === "recurrente") {
            const actualDate = new Date();
            const paymentDate = addMonths(new Date(actualDate), 1);
            const dueDate = addDays(new Date(paymentDate), 2);

            await FeeControl.create(
              {
                feeNo: Number(fee.feeNo) + 1,
                paymentDate,
                dueDate,
                statusId: 1,
                debitId: fee.debit.id,
              },
              { transaction: trx }
            );

            await Debit.update(
              { statusId: 1, startPaymentDate: paymentDate, attempts: 0 },
              { where: { id: debit.id }, transaction: trx }
            );
          } else {
            const feePaymentDate = await FeeControl.findOne({
              where: { statusId: 1, debitId: fee.debit.id },
              attributes: ["paymentDate"],
            });

            await Debit.update(
              {
                startPaymentDate: !feePaymentDate.paymentDate ? fee.debit.startPaymentDate : feePaymentDate.paymentDate,
                remainingAmount: Number(fee.debit.remainingAmount) - Number(fee.debit.feeAmount),
                remainingPayments: Number(fee.debit.remainingPayments) - 1,
                attempts: 0,
                statusId: Number(fee.debit.remainingPayments) - 1 === 0 ? 3 : 1,
              },
              { where: { id: fee.debit.id }, transaction: trx }
            );
          }
        }); // END OF TRANSACION
      } else {
        const newAttempts = Number(fee.debit.attempts) - 1;

        await db.transaction(async (trx) => {
          await Debit.update(
            {
              statusId: newAttempts === 0 ? 5 : 4,
              attempts: newAttempts,
            },
            { where: { id: fee.debit.id }, transaction: trx }
          );

          if (newAttempts === 0) {
            await FeeControl.update(
              { statusId: 4 },
              {
                where: {
                  debitId: fee.debitId,
                  [Op.not]: { statusId: 3 },
                },
              }
            );
          } else {
            await FeeControl.update({ statusId: 4 }, { where: { id: fee.id } });
          }
        });

        // if (newAttempts === 0) {
        //   console.log('Ya no hay más intentos para este pago. se dará como  y se enviará correo.');
        // }
      }
    }

    return debitPayments;
  } catch (error) {
    throw error;
  }
};

const deleteProcessedPayments = async (payments) => {
  try {
    for (payment of payments) {
      await BankPayment.destroy({ where: { id: payment.id } });
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getBankPayments,
  generateCiserFile,
  processCiserFile,
};
