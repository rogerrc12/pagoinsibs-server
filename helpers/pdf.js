const moment = require("moment");
const { formatAmountBs } = require("./functions");

const generatePdfHr = (doc, y) => {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
};

const generatePdfHeader = (doc, image) => {
  doc
    .image(image, 50, 45, { width: 110 })
    .fillColor("#444444")
    .fontSize(12)
    .text("Av. Las Delicias, CE Europa", 200, 65, { align: "right" })
    .text("Maracay, Edo. Aragua", 200, 80, { align: "right" })
    .moveDown();
};

const generatePdfFooter = (doc) => {
  doc
    .fontSize(9)
    .text("Los pagos son reflejados en tu cuenta en un lapso no mayor a 24 horas.", 50, 760, { align: "center", width: 500 })
    .text("Si tienes alguna duda contáctanos al 0500-4674270. Gracias por usar nuestros servicios", 50, 775, { align: "center", width: 500 });
};

const generateDebitInfo = (doc, debit) => {
  doc.fillColor("#444444").fontSize(18).text(`Recibo de domiciliación #${debit.id}`, 50, 160);

  generatePdfHr(doc, 185);

  doc
    .fontSize(10)
    .text("Domiciliación ID:", 50, 200)
    .font("Helvetica-Bold")
    .text(debit.debitKey, 130, 200)
    .font("Helvetica")
    .text(`Fecha de inicio: ${moment(debit.startPaymentDate).format("DD MMM YYYY")}`, 50, 215)
    .text(`Fecha de culminación: ${debit.endPaymentDate ? moment(debit.endPaymentDate).format("DD MMM YYYY") : "A definir por el usuario"}`, 50, 230)
    .text("Monto del servicio:", 50, 245)
    .font("Helvetica-Bold")
    .text(formatAmountBs(debit.amount), 135, 245)
    .font("Helvetica")
    .text(`Empresa receptora: ${debit.supplier.name}`, 50, 260)
    .text(`RIF: ${debit.supplier.rif}`, 50, 275)
    .text(`Descripción: ${debit.description}`, 50, 305)
    .text(`Banco a debitar: ${debit.bankName}`, 50, 320)

    .font("Helvetica-Bold")
    .text(`${debit.user.firstName.toUpperCase() + " " + debit.user.lastName.toUpperCase()}`, 400, 200)
    .font("Helvetica")
    .text(debit.user.cedula, 400, 215)
    .text(debit.user.address, 400, 230)
    .font("Helvetica-Bold")
    .text("No. de cuenta:", 350, 305)
    .font("Helvetica")
    .text(debit.accNumber, 425, 305)
    .font("Helvetica-Bold")
    .text("Tipo de cuenta:", 350, 320)
    .font("Helvetica")
    .text(debit.accType, 430, 320)
    .moveDown();

  generatePdfHr(doc, 340);
};

const generateFeesTable = (doc, fees) => {
  doc.font("Helvetica-Bold").text("Cuota no.", 50, 372).text("Fecha de cobro", 200, 372).text("Status", 330, 372).text("Monto de cuota", 280, 372, { align: "right" });

  generatePdfHr(doc, 392);

  let Yaxis = 390;

  for (let fee of fees) {
    Yaxis += 20;

    doc
      .font("Helvetica")
      .text(`#${fee.feeNo}`, 50, Yaxis)
      .text(moment(fee.paymentDate).format("DD/MM/YYYY"), 200, Yaxis)
      .text(fee.status.name, 330, Yaxis)
      .font("Helvetica-Bold")
      .text(formatAmountBs(fee.debit.feeAmount), 280, Yaxis, { align: "right" });
  }
};

const generatePaymentInformation = (doc, payment) => {
  doc.fillColor("#444444").fontSize(18).text(`Recibo pago único #${payment.id}`, 50, 160);

  generatePdfHr(doc, 185);

  doc
    .fontSize(10)
    .text("Pago ID:", 50, 200)
    .font("Helvetica-Bold")
    .text(payment.paymentKey, 93, 200)
    .font("Helvetica")
    .text(`Fecha del pago: ${moment(payment.createdAt).format("DD MMM YYYY")}`, 50, 215)
    .text("Monto del pago:", 50, 230)
    .font("Helvetica-Bold")
    .text(formatAmountBs(payment.amount), 125, 230)
    .font("Helvetica")
    .text(`Empresa receptora: ${payment.supplier.name}`, 50, 255)
    .text(`RIF: ${payment.supplier.rif}`, 50, 270)

    .font("Helvetica-Bold")
    .text(`${payment.user.firstName.toUpperCase() + " " + payment.user.lastName.toUpperCase()}`, 400, 200)
    .font("Helvetica")
    .text(payment.user.cedula, 400, 215)
    .text(payment.user.address, 400, 230)
    .moveDown();

  generatePdfHr(doc, 292);
};

const generateInvoicePaymentTable = (doc, payment) => {
  doc.font("Helvetica-Bold").text("Cuenta a debitar", 50, 372).text("Descripción", 200, 372).text("Status", 330, 372).text("Monto", 280, 372, { align: "right" });

  generatePdfHr(doc, 392);

  doc
    .font("Helvetica")
    .text(`${payment.bankName} - ${payment.accType}`, 50, 400)
    .text(payment.accNumber, 50, 417)
    .text(payment.description, 200, 409)
    .text(payment.status.name, 330, 409)
    .font("Helvetica-Bold")
    .text(formatAmountBs(payment.amount), 280, 409, { align: "right" });

  generatePdfHr(doc, 432);
};

module.exports = {
  generatePdfHeader,
  generatePdfFooter,
  generatePdfHr,
  generateDebitInfo,
  generateFeesTable,
  generatePaymentInformation,
  generateInvoicePaymentTable,
};
