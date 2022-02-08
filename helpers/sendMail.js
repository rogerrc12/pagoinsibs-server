const mail = require("../mail/config");
const moment = require("moment");
const { formatAmount } = require("./functions");

const sendPaymentEmails = async (supplier, payment, user) => {
  // send email to user
  const userOptions = {
    email: user.secondaryEmail ? [user.email, user.secondaryEmail] : user.email,
    subject: "Nueva solicitud de pago",
    template: "account_payment_sender",
    variables: JSON.stringify({
      name: user.name,
      payment_id: payment.id,
      payment_type: `Pago con ${payment.paymentType === "account" ? "cuenta" : payment.paymentType}`,
      supplier_name: supplier.name,
      date_issued: moment(payment.createdAt).format("DD-MM-YYYY [a las] hh:mm a"),
      amount: formatAmount(payment.amount),
      description: payment.description,
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
      amount: `${formatAmount(payment.amount)} ${payment.currencyId === 1 ? "$" : "Bs."}`,
      description: payment.description,
      sender_cedula: user.cedula,
      payment_type: payment.paymentType,
    }),
  };
  await mail.send(supplierOptions);

  // Send email to the system
  const systemOptions = {
    email: "cobranzadigital@insibs.com",
    subject: "Se ha generado un nuevo pago",
    template: "new_acc_payment",
    variables: JSON.stringify({
      userName: user.name,
      date: moment(payment.createdAt).format("DD-MM-YYYY [a las] hh:mm a"),
      paymentType: `Pago con ${payment.paymentType === "account" ? "cuenta" : payment.paymentType}`,
      userCedula: user.cedula,
      adminAddress: "https://admn.pagoinsibs.com",
    }),
  };
  await mail.send(systemOptions);
};

const sendDebitEmails = async (supplier, debit, product, user) => {
  // Send email to user
  const debitOptions = {
    email: user.secondaryEmail ? [user.email, user.secondaryEmail] : user.email,
    subject: `Has creado una nueva domiciliación`,
    template: "direct_debit_sender",
    variables: JSON.stringify({
      name: user.name,
      date_issued: moment(debit.createdAt).format("DD/MM/YYYY [a las] hh:mm a"),
      debit_id: debit.id,
      description: debit.description,
      fee_amount: `${formatAmount(debit.feeAmount)} ${debit.currencyId === 1 ? "$" : "Bs."}`,
      payment_frequency: debit.paymentFrequency === null ? "cuotas indefinidas" : debit.paymentFrequency + " cuotas",
      supplier_name: supplier.name,
      product_name: product.name,
    }),
  };
  await mail.send(debitOptions);

  // Send email to the system
  const systemOptions = {
    email: "cobranzadigital@insibs.com",
    subject: "Se ha generado un nueva domiciliación",
    template: "new_direct_debit",
    variables: JSON.stringify({
      userName: user.name,
      date: moment(debit.createdAt).format("DD-MM-YYYY [a las] hh:mm a"),
      userCedula: user.cedula,
      adminAddress: "https://admn.pagoinsibs.com",
    }),
  };
  await mail.send(systemOptions);
};

module.exports = {
  sendPaymentEmails,
  sendDebitEmails,
};
