const path = require("path");
const db = require("../../config/db");
const { v4 } = require("uuid");
const instapago = require("instapago");
const moment = require("moment");
const mail = require("../../mail/config");
const ccGateway = instapago(process.env.NODE_ENV !== "production" ? process.env.INSTAPAGO_TEST_KEY : process.env.INSTAPAGO_KEY, process.env.INSTAPAGO_PUBLICKEY);
const { validationResult } = require("express-validator/check");
const { sendPaymentEmails } = require("../../helpers/sendMail");
const { addDays } = require("../../helpers/functions");
// PDF HELPERS
const PDFDocument = require("pdfkit");
const { generatePdfFooter, generatePdfHeader, generatePaymentInformation, generateInvoicePaymentTable } = require("../../helpers/pdf");
// MODELS
const Bank = require("../../models/admin/bank");
const User = require("../../models/user");
const Payment = require("../../models/payment");
const Account = require("../../models/account");
const Status = require("../../models/status");
const Currency = require("../../models/currency");
const Supplier = require("../../models/admin/supplier");

const getPayments = async function (req, res, next) {
  try {
    const payments = await Payment.findAll({ include: [{ model: Status }, { model: Supplier }, { model: Currency }], where: { userId: req.user.id } });

    return res.status(200).json(payments);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const getPaymentDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, { include: [{ model: Supplier }, { model: Status }, { model: Currency }] });

    return res.json(payment);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const sendPaymentDetails = async (req, res, next) => {
  const { payment_id, type } = req.params;

  try {
    const payment = await Payment.findByPk(payment_id, { include: [{ model: Status }, { model: Supplier }, { model: User }] });

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
        template: type === "tdc" ? "detail_tdc_payment" : "detail_acc_payment",
        attachment: pdfData,
        filename: "invoice.pdf",
        variables:
          type === "tdc"
            ? JSON.stringify({
                name: req.user.name,
                payment_id,
                date_issued: moment(payment.createdAt).format("DD-MM-YYYY hh:mm a"),
              })
            : JSON.stringify({
                name: req.user.name,
                payment_id,
                date_issued: moment(payment.createdAt).format("DD-MM-YYYY hh:mm a"),
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

const getSimilarPayments = ({ amount, supplierId, paymentType }) => Payment.findAll({ where: { amount, supplierId, paymentType }, raw: true });
const getAccountById = (accountId) => Account.findByPk(accountId, { include: Bank });
const checkSimilarPayments = (payments) => {
  const SECONDS = 30;

  let rejected;

  for (let payment of payments) {
    const NOW = moment();
    const paymentDate = moment(payment.createdAt);

    if (NOW.diff(paymentDate, "seconds") <= SECONDS) rejected = true;
  }

  return rejected;
};

const creditCardGateway = (req) => {
  const { description, amount, cardNumber, cardName, cardCedula, cardMonth, cardYear, cardCvc } = req.body;

  return ccGateway.pay({
    amount: parseFloat(amount),
    description,
    cardholder: cardName,
    cardholderid: cardCedula,
    cardnumber: cardNumber.replace(/\s/g, ""),
    cvc: cardCvc,
    expirationdate: `${cardMonth}/${"20" + cardYear}`,
    statusid: 2,
    ip: req.ip,
  });
};

const createPayment = async function (req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const similarPayments = await getSimilarPayments(req.body);

    if (similarPayments.length > 0) {
      const rejected = checkSimilarPayments(similarPayments);
      if (rejected) {
        const error = new Error("Debes esperar al menos 30 segundos para hacer una operación por el mismo monto.");
        error.statusCode = 409;
        throw error;
      }
    }

    const { description, amount, supplierId, accountId, paymentType, productId, currencyId, cardNumber, paypalEmail, paypalPaymentId, withCurrencyConversion } = req.body;

    let accountData;

    const dateNow = new Date();
    const paymentKey = v4();
    const paymentValues = {
      description,
      amount: parseFloat(amount),
      userId: req.user.id,
      supplierId,
      productId: productId || null,
      startPaymentDate: dateNow,
      endPaymentDate: addDays(dateNow, 2),
      paymentKey,
      statusId: 1,
      paymentType,
      currencyId,
      withCurrencyConversion,
    };

    if (accountId && paymentType === "account") {
      accountData = await getAccountById(accountId);
      paymentValues.accNumber = accountData.accNumber;
      paymentValues.bankName = accountData.bank.bankName;
      paymentValues.accType = accountData.accType;
    } else if (cardNumber && paymentType === "card") {
      // USE PAYMENT GATEWAY WITH CARD VALUES AND RETURN
      const creditCardPaymentRes = await creditCardGateway(req);
      // CHECK IF PAYMENT GATEWAY SUCCEDED OR NOT
      if (!creditCardPaymentRes.data.success) {
        let message;
        const tdcMessage = creditCardPaymentRes.data.message || creditCardPaymentRes.message;

        tdcMessage.includes("CardNumber field is not a valid credit card number.")
          ? (message = "El número de la tarjeta es incorrecto, verifiquelo e intente de nuevo.")
          : tdcMessage.includes("FONDO INSUFICIENTE")
          ? (message = "Fondo insuficiente en su tarjeta. Por favor intente con otra.")
          : (message = "Ha ocurrido un error con la tarjeta usada, por favor intente de nuevo o con otra tarjeta.");

        const error = new Error(message);
        error.statusCode = 400;
        throw error;
      } else {
        paymentValues.cardBrand = Number(cardNumber.substring(0, 1)) === 4 ? "VISA" : Number(cardNumber.substring(0, 1)) === 5 ? "MASTER" : "OTROS";
        paymentValues.cardLastNumbers = cardNumber.replace(/\s/g, "").substring(12, 16);
      }
    } else if (paymentType === "zelle") {
      paymentValues.zelleFileUrl = req.file.location;
    } else if (paymentType === "paypal") {
      paymentValues.paypalEmail = paypalEmail;
      paymentValues.paypalPaymentId = paypalPaymentId;
      paymentValues.statusId = 3;
    } else {
      const error = new Error("No se ha encontrado una opción de pago válida. Si cree que esto es un error, por favor contacte a soporte.");
      error.statusCode = 404;
      throw error;
    }

    const newPayment = await Payment.create(paymentValues);
    return res.status(200).json(newPayment);

    // const supplier = await Supplier.findByPk(supplier_id);
    // sendPaymentEmails(supplier, newPayment, req.user, "Con cuenta");
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentDetail,
  sendPaymentDetails,
  checkSimilarPayments,
  createPayment,
};
