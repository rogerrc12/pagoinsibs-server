const mail = require('../mail/config');
const moment = require('moment');
const { formatAmountBs } = require('./functions');

const sendPaymentEmails = async (supplier, payment, user, paymentType) => {
  
  // send email to user
  const userOptions = {
    email: user.email,
    subject: `Nueva solicitud de pago ${paymentType}`,
    template: "account_payment_sender",
    variables: JSON.stringify({
      name: user.name,
      payment_id: payment.id,
      supplier_name: supplier.name,
      date_issued: moment(payment.createdAt).format("DD-MM-YYYY [a las] hh:mm a"),
      amount: formatAmountBs(payment.amount),
      description: payment.description
    }),
  };
  await mail.send(userOptions);
  
  // Send email to supplier
  const supplierOptions = {
    email: supplier.email,
    subject: `Se ha generado un nuevo pago único para ${supplier.name}`,
    template: "new_acc_payment_supplier",
    variables: JSON.stringify({
      sender_name: user.name,
      date_issued: moment(payment.createdAt).format("DD-MM-YYYY [a las] hh:mm a"),
      supplier_name: supplier.name,
      amount: formatAmountBs(payment.amount),
      description: payment.description,
      sender_cedula: user.cedula,
    }),
  };
  await mail.send(supplierOptions);
  
  // Send email to the system
  const systemOptions = {
    email: 'cobranzadigital@insibs.com',
    subject: `Se ha generado un nuevo pago único ${paymentType}`,
    template: 'new_acc_payment',
    variables: JSON.stringify({
      userName: user.name,
      date: moment(payment.createdAt).format("DD-MM-YYYY [a las] hh:mm a"),
      userCedula: user.cedula,
      adminAddress: "https://admn.pagoinsibs.com"
    }),
  };
  await mail.send(systemOptions);
  
}

const sendDebitEmails = async (supplier, debit, user) => {
  // Send email to user
  const debitOptions = {
    email: user.email,
    subject: `Nueva solicitud de domiciliación`,
    template: 'direct_debit_sender',
    variables: JSON.stringify({
      name: user.name,
      date_issued: moment(debit.createdAt).format('DD/MM/YYYY [a las] hh:mm a'),
      debit_id: debit.id,
      description: debit.description,
      fee_amount: debit.feeAmount,
      payment_frequency: debit.paymentFrequency === null ? 'cuotas indefinidas' : debit.paymentFrequency + ' cuotas',
      supplier_name: supplier.name
    })
  }
  await mail.send(debitOptions);
  
  // Send email to the system
  const systemOptions = {
    email: 'cobranzadigital@insibs.com',
    subject: 'Se ha generado un nueva domiciliación',
    template: 'new_direct_debit',
    variables: JSON.stringify({
      userName: user.name,
      date: moment(debit.createdAt).format("DD-MM-YYYY [a las] hh:mm a"),
      userCedula: user.cedula,
      adminAddress: "https://admn.pagoinsibs.com"
    }),
  };
  await mail.send(systemOptions);
}

module.exports = {
  sendPaymentEmails,
  sendDebitEmails
}