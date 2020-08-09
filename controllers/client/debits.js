const db = require('../../config/db');
const Debit = require('../../models/debit');
const FeeControl = require('../../models/feeControl');
const Account = require('../../models/account');
const User = require('../../models/user');
const Bank = require('../../models/admin/bank');
const Supplier = require('../../models/admin/supplier');
const Product = require('../../models/admin/product');
const Status = require('../../models/status');
const path = require('path');
const { v4 } = require('uuid');
const mail = require('../../mail/config');
const { calculateEndDate, addDays } = require("../../helpers/functions");
const { validationResult } = require('express-validator/check');
const moment = require('moment');
const PDFDocuemnt = require('pdfkit');
const { generatePdfFooter, generatePdfHeader, generateDebitInfo, generateFeesTable } = require('../../helpers/pdf');
const { sendDebitEmails } = require('../../helpers/sendMail');


const getDebits = async (req, res, next) => { 
  try {
    const debits = await Debit.findAll({ where: { userId: req.user.id }, include: [{ model: Product }, {model: Status}] });
    
    return res.status(200).json(debits);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
}

const getSimilarDebit = async body => {
  const { product_id, total_amount, fee_amount } = body;
  return Debit.findAll({
    where: {
      feeAmount: !fee_amount ? Number(total_amount) : Number(fee_amount),
      productId: product_id
    }, raw: true
  });
}

const checkSimilarDebits = debits => {
  const TWO_MINS = 2;
  let rejected = false;
  
  for (let debit of debits) {
    const NOW = moment();
    const debitDate = moment(debit.createdAt)
    
    if (NOW.diff(debitDate, 'minutes') <= TWO_MINS) rejected = true;
  }
  return rejected;
}

const getDebitDetail = async (req, res, next) => {
  const { id } = req.params;

  try {
    const debitDetail = await Debit.findByPk(id, { include: [{model: Status}, {model: Product}, {model: Supplier}] }); 
    
    if (debitDetail) {
      
      const fees = await FeeControl.findAll({ where: {debitId: id}, include: [{model: Status, attributes: ['name'] }] });
      const details = {details: debitDetail, fees}
      
      return res.json(details);
    } else {
      const error = new Error('No se ha podido obtener el detalle de la domciliación. Revisa la conexión a internet, si el problema persiste por favor contacte a soporte.');
      error.statusCode = 404;
      throw error;
    }
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
}

const sendDebitDetails = async (req, res, next) => {
  const { debit_id } = req.params;

  try {
    const debit = await Debit.findByPk(debit_id, { include: [{model: User}, {model: Status}, {model: Product}, {model: Supplier}] });
    const fees = await FeeControl.findAll({ where: {debitId: debit_id}, include: [{model: Status}, {model: Debit}] });

    const doc = new PDFDocuemnt({ size: 'A4', margin: 50 });
    const logo = path.join(__dirname, "..", "..", "assets", "images", "main-logo.png");
    // CREATE PDF
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      let pdfData = Buffer.concat(buffers);
      
      const options = { 
        email: req.user.email,
        subject: `Detalle de la domiciliación no. ${debit_id}`, template: 'debit_details',
        attachment: pdfData,
        filename: "invoice.pdf",
        variables: 
          JSON.stringify({ 
            name: req.user.name, 
            debit_id, 
            date_issued: moment(debit.createdAt).format('DD-MM-YYYY hh:mm a')
        })
      }

      await mail.send(options)
    });

    generatePdfHeader(doc, logo);
    generateDebitInfo(doc, debit);
    generateFeesTable(doc, fees);
    generatePdfFooter(doc);
    doc.end();

    return res.json({ email: req.user.email });

  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
}

const createDebit = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 422;
    throw error;
  }

  const { account_id, supplier_id, product_id, description, total_amount, debit_type, start_payment_date, payment_period, payment_frequency, fee_amount } = req.body;
  
  try {
    // Look for a payment with similar amount and supplier
    const similarDebit = await getSimilarDebit(req.body);
    
    // check if one of the similar Debits was done before 5 minutes ago
    if (similarDebit) {
      const rejected = checkSimilarDebits(similarDebit);
      
      if (rejected) {
        const error = new Error('Debes esperar al menos 2 minutos para hacer una operación con el mismo monto.');
        error.statusCode = 409;
        throw error;
      }

    } // END IF

    // CREATE NEW DEBIT

    // get usersAccount
    const userAccount = await Account.findOne({ where: {id: account_id, userId: req.user.id}, include: Bank });

    // calculate end payment date
    const endDate = calculateEndDate( payment_period, start_payment_date, payment_frequency );
    const debit_key = v4();
    
    const directDebit = {
      userId: req.user.id,
      accNumber: userAccount.accNumber,
      bankName: userAccount.bank.bankName,
      accType: userAccount.accType,
      supplierId: supplier_id,
      productId: product_id,
      description,
      totalAmount: Number(total_amount),
      feeTotalAmount: Number(total_amount),
      debitType: debit_type,
      startPaymentDate: start_payment_date,
      endPaymentDate: debit_type === 'recurrente' ? null : endDate,
      paymentPeriod: payment_period !== "" ? payment_period : "mensual",
      paymentFrequency: payment_frequency > 0 ? payment_frequency : null,
      remainingPayments: payment_frequency > 0 ? payment_frequency : null,
      remainingAmount: Number(total_amount),
      feeAmount: fee_amount > 0 ? fee_amount : Number(total_amount),
      statusId: 1,
      debitKey: debit_key
    };

    const newDirectDebit = await db.transaction(async trx => {

      // Insert new debit and return
      const newDebit = await Debit.create(directDebit, { transaction: trx });

      // create payment frequency and dates to fees
      const { paymentFrequency, id } = newDebit;

      let iteration = !paymentFrequency ? 1 : paymentFrequency;

      for (let i = 0; i < iteration; i++) {
        let fee_frequency = i;

        let payment_date;
        if (i === 0) {
          payment_date = start_payment_date;
        } else {
          payment_date = calculateEndDate(payment_period, start_payment_date, fee_frequency);
        }

        const due_date = addDays(new Date(payment_date), 2);

        await FeeControl.create({ feeNo: i + 1, paymentDate: payment_date, dueDate: due_date, statusId: 1, debitId: id }, { transaction: trx });
      }

      return newDebit;
    });

    res.status(200).json(newDirectDebit);

    const supplier = await Supplier.findByPk(supplier_id);
    return await sendDebitEmails(supplier, newDirectDebit, req.user);

  } catch (error) {
   if (!error.statusCode) error.statusCode = 500;
   next(error);
  }
}

module.exports = {
  getDebits,
  getSimilarDebit,
  getDebitDetail,
  sendDebitDetails,
  createDebit
};
