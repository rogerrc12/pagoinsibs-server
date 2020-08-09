const path = require("path");;
const db = require("../../config/db");
const { v4 } = require('uuid');
const instapago = require("instapago");
const moment = require("moment");
const mail = require("../../mail/config");
const ccGateway = instapago(process.env.INSTAPAGO_KEY, process.env.INSTAPAGO_PUBLICKEY);
const { validationResult } = require("express-validator/check");
const { sendPaymentEmails } = require('../../helpers/sendMail');
// PDF HELPERS
const PDFDocument = require("pdfkit");
const { generatePdfFooter, generatePdfHeader, generatePaymentInformation, generateInvoicePaymentTable } = require("../../helpers/pdf");
// MODELS
const Bank = require('../../models/admin/bank');
const User = require('../../models/user');
const AccPayment = require('../../models/accPayment');
const CcPayment = require('../../models/ccPayment');
const Account = require('../../models/account');
const Status = require('../../models/status');
const Supplier = require('../../models/admin/supplier');

const getPayments = async function (req, res, next) {
  try {
    const accPayments = await AccPayment.findAll({ include: [{model: Status}, {model: Supplier}], where: { userId: req.user.id } });
    const ccPayments = await CcPayment.findAll({ include: [{model: Status}, {model: Supplier}], where: { userId: req.user.id } });
    const payments = [...accPayments, ...ccPayments];
    
    return res.status(200).json(payments);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getPaymentDetail = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    let payment;
    type === "account"
      ? payment = await AccPayment.findByPk(id, { include: [{model: Supplier}, {model: Status}] })
      : payment = await CcPayment.findByPk(id, { include: [{model: Supplier}, {model: Status}] })
    
    return res.json(payment);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const sendPaymentDetails = async (req, res, next) => {
  const { payment_id, type } = req.params;

  try {
    let payment;
    if (type === "tdc") {
      payment = await CcPayment.findByPk(payment_id, { include: [{model: Status}, {model: Supplier}, {model: User}] })
    } else {
      payment = await AccPayment.findByPk(payment_id, { include: [{model: Status}, {model: Supplier}, {model: User}] })
    }
    
      // CREATE THE INVOICE PDF
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const logo = path.join(__dirname, "..", "..", "assets", "images", "main-logo.png");

      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", async () => {
        let pdfData = Buffer.concat(buffers);

        const options = {
          email: req.user.email,
          subject: `Detalle del pago no. ${payment_id}`,
          template:
            type === "tdc" ? "detail_tdc_payment" : "detail_acc_payment",
          attachment: pdfData,
          filename: "invoice.pdf",
          variables:
            type === "tdc"
              ? JSON.stringify({
                  name: req.user.name,
                  payment_id,
                  date_issued: moment(payment.createdAt).format("DD-MM-YYYY hh:mm a")
                })
              : JSON.stringify({
                  name: req.user.name,
                  payment_id,
                  date_issued: moment(payment.createdAt).format("DD-MM-YYYY hh:mm a")
                }),
        };

        await mail.send(options);
      });

      generatePdfHeader(doc, logo);
      generatePaymentInformation(doc, payment);
      generateInvoicePaymentTable(doc, payment);
      generatePdfFooter(doc);
      doc.end();

      return res.json({ email: req.user.email });
    
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const getSimilarAccPayment = async function (body) {
  const { amount, supplier_id } = body;
  return AccPayment.findAll({where: {amount, supplierId: supplier_id}, raw: true});
};

const getSimilarCcPayment = async function (body) {
  const { amount, supplier_id } = body;
  return CcPayment.findAll({where: {amount, supplierId: supplier_id}, raw: true});
};

const checkSimilarPayments = function (payments) {
  const TWO_MINS = 2;
  
  let rejected;

  for (let payment of payments) {
    const NOW = moment();
    const paymentDate = moment(payment.createdAt);
    
    if (NOW.diff(paymentDate, 'minutes') <= TWO_MINS) rejected = true;
  }

  return rejected;
};

const createAccPayment = async function (req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const similarPayments = await getSimilarAccPayment(req.body);
    
    if (similarPayments.length > 0) {
      const rejected = checkSimilarPayments(similarPayments);
      if (rejected) {
        const error = new Error('Debes esperar al menos 2 minutos para hacer una operación por el mismo monto.')
        error.statusCode = 409;
        throw error;
      }
    }

    const { description, amount, supplier_id, account_id } = req.body;
    //
    const newPayment = await db.transaction(async trx => {
      const account = await Account.findByPk(account_id, { include: Bank, transaction: trx });
  
      // Create new payment constructor
      const uniqueKey = v4();
  
      const payment = {
        description,
        amount: parseFloat(amount),
        userId: req.user.id,
        accNumber: account.accNumber,
        bankName: account.bank.bankName,
        accType: account.accType,
        supplierId: supplier_id,
        startPaymentDate: new Date(),
        paymentKey: uniqueKey,
        statusId: 1
      };
      
      return AccPayment.create(payment, {transaction: trx});
    }); // TRANSACTION END
  
    res.json(newPayment);

    const supplier = await Supplier.findByPk(supplier_id);

    return await sendPaymentEmails(supplier, newPayment, req.user, 'Con cuenta');
    
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const ccPayment = async function (req) {
  const {
    description,
    amount,
    number,
    name,
    cedula,
    month,
    year,
    cvc,
  } = req.body;

  return ccGateway.pay({
    amount: parseFloat(amount),
    description,
    cardholder: name,
    cardholderid: cedula,
    cardnumber: number.replace(/\s/g, ""),
    cvc,
    expirationdate: `${month}/${"20" + year}`,
    statusid: 2,
    ip: req.ip,
  });
};

const createCcPayment = async function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    throw error;
  }

  const { description, amount, supplier_id, number } = req.body;

  try {
    // check if similar payment within 5 minutes ago
    const similarPayments = await getSimilarCcPayment(req.body);

    if (similarPayments.length > 0) {
      const rejected = checkSimilarPayments(similarPayments);
      if (rejected) {
        const error = new Error('Haz realizado una transacción similar hace menos de 5 minutos');
        error.statusCode = 409;
        throw error;
      }
    }

    // credit card connection to API
    const paymentRes = await ccPayment(req);
    if (!paymentRes.data.success) {
      let message;
      const tdcMessage = paymentRes.data.message || paymentRes.message;

      tdcMessage.includes('CardNumber field is not a valid credit card number.')
        ? message = 'El número de la tarjeta es incorrecto, verifiquelo e intente de nuevo.' 
        : tdcMessage.includes('FONDO INSUFICIENTE')
          ? message = 'Fondo insuficiente en su tarjeta. Por favor intente con otra.'
          : message = 'Ha ocurrido un error con la tarjeta usada, por favor intente de nuevo o con otra tarjeta.'

      const error = new Error(message);
      error.statusCode = 400;
      throw error;
    }

    // Add payment to database
    const uniqueKey = v4();

    await CcPayment.create({
      description,
      amount,
      userId: req.user.id,
      supplierId: supplier_id,
      paymentKey: uniqueKey,
      cardBrand: Number(number.substring(0, 1)) === 4 ? 'VISA' : Number(number.substring(0, 1)) === 5 ? 'MASTER' : 'OTROS',
      cardLastNumbers: number.replace(/\s/g, '').substring(12, 16),
      statusId: 3
    });

    const payment = await CcPayment.findOne({ where: {paymentKey: uniqueKey}, include: Supplier });
  
    await res.status(200).json(payment);
  
    const supplier = await Supplier.findByPk(supplier_id);
    return await sendPaymentEmails(supplier, payment, req.user, 'con Tarjeta de crédito.');
    
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentDetail,
  sendPaymentDetails,
  getSimilarAccPayment,
  getSimilarCcPayment,
  checkSimilarPayments,
  createAccPayment,
  ccPayment,
  createCcPayment,
};
