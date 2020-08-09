const Excel = require('exceljs');
const moment = require('moment');
const { formatAmountBs } = require('./functions');

const generateSiserFile = (correlative, debits, payments) => {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(`correlativo #${correlative}`);
  
  worksheet.columns = [
    { header: 'Número de lote', key: 'lot_number', width: 15 },
    { header: 'Número registro', key: 'id_number', width: 15 },
    { header: 'Nacionalidad', key: 'ci_type', width: 13 },
    { header: 'Cédula', key: 'ci_number', width: 10 },
    { header: 'Nombre', key: 'first_name', width: 20 },
    { header: 'Apellido', key: 'last_name', width: 20 },
    { header: 'Sexo', key: 'gender', width: 5 },
    { header: 'Fecha de nacimiento', key: 'birthday', width: 20 },
    { header: 'Parentesco', key: 'relationship', width: 20 },
    { header: 'Código banco', key: 'bank_name', width: 30 },
    { header: 'Tipo de cuenta', key: 'acc_type', width: 13 },
    { header: 'Número de cuenta', key: 'acc_number', width: 23 },
    { header: 'Tipo de vencimiento', key: 'payment_period', width: 17 },
    { header: 'Número de cuotas', key: 'payment_frequency', width: 10 },
    { header: 'Monto de cuotas', key: 'fee_amount', width: 18 },
    { header: 'Monto de contrato', key: 'fee_total_amount', width: 18 },
    { header: 'Monto de contado', key: 'total_amount', width: 18 },
    { header: 'Código cliente', key: 'client_id', width: 20 },
    { header: 'Código de institución', key: 'ciser_id', width: 17 },
    { header: 'Código de sucursal', key: 'ciser_branch', width: 17 }
  ];
  
  if (debits.length > 0) {
    debits.forEach(debit => {
      worksheet.addRow({
        lot_number: debit.correlativeId,
        id_number: debit.registerID,
        ci_type: debit.user.cedula.substring(0, 1).toUpperCase(),
        ci_number: debit.user.cedula.substring(1, 12),
        first_name: debit.user.firstName.toUpperCase(),
        last_name: debit.user.lastName.toUpperCase(),
        gender: debit.user.gender,
        birthday: moment(debit.user.birthday).format('DD/MM/YYYY'),
        relationship: 'Afiliado principal',
        bank_name: debit.fee.debit.bankName.toUpperCase(),
        acc_type: debit.fee.debit.accType.substring(0, 1).toUpperCase(),
        acc_number: debit.clientAccNumber,
        payment_period: debit.fee.debit.paymentPeriod.substring(0, 1).toUpperCase(),
        payment_frequency: 1,
        fee_amount: debit.amount,
        fee_total_amount: debit.amount,
        total_amount: debit.amount,
        client_id: debit.user.clientId,
        ciser_id: '50',
        ciser_branch: '01'
      })
    });
  }
  
  if (payments.length > 0) {
    payments.forEach(payment => {
      worksheet.addRow({
        lot_number: payment.correlativeId,
        id_number: payment.registerID,
        ci_type: payment.user.cedula.substring(0, 1).toUpperCase(),
        ci_number: payment.user.cedula.substring(1, 12),
        first_name: payment.user.firstName.toUpperCase(),
        last_name: payment.user.lastName.toUpperCase(),
        gender: payment.user.gender,
        birthday: moment(payment.user.birthday).format('DD/MM/YYYY'),
        relationship: 'Afiliado principal',
        bank_name: payment.payment.bankName.toUpperCase(),
        acc_type: payment.payment.accType.substring(0, 1).toUpperCase(),
        acc_number: payment.clientAccNumber,
        payment_period: 'A',
        payment_frequency: 1,
        fee_amount: payment.amount,
        fee_total_amount: payment.amount,
        total_amount: payment.amount,
        client_id: payment.user.clientId,
        ciser_id: '50',
        ciser_branch: '01'
      })
    });
  }
  
  return workbook;
}

const createPendingReport = (fees, payments) => {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(`Cuotas por cobrar`);

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'CLIENTE', key: 'client_name', width: 30 },
    { header: 'CÉDULA', key: 'client_cedula', width: 15 },
    { header: 'FECHA DE COBRO', key: 'due_date', width: 18 },
    { header: 'MONTO DE CUOTA', key: 'fee_amount', width: 18 },
    { header: 'BANCO', key: 'bank_name', width: 20 },
    { header: 'EMPRESA O COMERCIO', key: 'supplier', width: 35 },
  ];

  worksheet.getRow(1).font = { bold: true, size: 12 };

  if (fees.length > 0) {
    for (let [i, fee] of fees.entries()) {
      worksheet.addRow({
        id: i + 1,
        client_name: fee.debit.user.firstName.toUpperCase() + ' ' + fee.debit.user.lastName.toUpperCase(),
        client_cedula: fee.debit.user.cedula,
        due_date: fee.paymentDate,
        fee_amount: formatAmountBs(fee.debit.feeAmount),
        bank_name: fee.debit.bankName,
        supplier: fee.debit.supplier.name
      });
    }
  }

  if (payments.length > 0) {
    for (let [i, payment] of payments.entries()) {
      worksheet.addRow({
        id: fees.length + (i + 1),
        client_name: payment.user.firstName.toUpperCase() + ' ' + payment.user.lastName.toUpperCase(),
        client_cedula: payment.user.cedula,
        due_date: payment.startPaymentDate,
        fee_amount: formatAmountBs(payment.amount),
        bank_name: payment.bankName,
        supplier: payment.supplier.name
      });
    }
  }

  worksheet.addRow();

  const totals = getTotalFromFees(fees, payments);

  const totalRowValues = [];
  totalRowValues[1] = `CUOTAS:  ${totals.totalReports}`;
  totalRowValues[5] = `PENDIENTE:  ${formatAmountBs(totals.totalPrice)}`;
  const cellNum = totals.totalReports + 3;
  const row = worksheet.addRow(totalRowValues);
  row.font = { bold: true, size: 12 };

  worksheet.mergeCells(`E${cellNum}`, `F${cellNum}`);
  worksheet.getCell(`A${cellNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: {argb:'FFFFFF00'} };
  worksheet.getCell(`E${cellNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: {argb:'FFFFFF00'} };

  return workbook;
}

const createExpiredReport = (debits, payments) => {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(`Cuotas vencidas`);

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'CLIENTE', key: 'client_name', width: 30 },
    { header: 'CÉDULA DE CLIENTE', key: 'client_cedula', width: 20 },
    { header: 'EMAIL DE CLIENTE', key: 'client_email', width: 30 },
    { header: 'TELÉFONO DE CLIENTE', key: 'client_phone', width: 20 },
    { header: 'NÚMERO DE CUOTAS', key: 'fees_no', width: 20 },
    { header: 'CUOTAS PENDIENTES', key: 'pending_fees', width: 20 },
    { header: 'EMPRESA', key: 'supplier', width: 35 }
  ];

  worksheet.getRow(1).font = { bold: true, size: 12 };

  if (debits.length > 0) {
    for (let [i, debit] of debits.entries()) {
      worksheet.addRow({
        id: i + 1,
        client_name: debit.user.firstName.toUpperCase() + debit.user.lastName.toUpperCase(),
        client_cedula: debit.user.cedula,
        client_email: debit.user.email,
        client_phone: debit.user.phone,
        fees_no: !debit.paymentFrequency ? 'recurrente' : debit.paymentFrequency,
        pending_fees: !debit.remainingPayments ? 'recurrente' : debit.remainingPayments,
        supplier: debit.supplier.name
      });
    }
  }

  if (payments.length > 0) {
    for (let [i, payment] of payments.entries()) {
      worksheet.addRow({
        id: debits.length + (i + 1),
        client_name: payment.user.firstName.toUpperCase() + ' ' + payment.user.lastName.toUpperCase(),
        client_cedula: payment.user.cedula,
        client_email: payment.user.email,
        client_phone: payment.user.phone,
        fees_no: 1,
        pending_fees: 1,
        supplier: payment.supplier.name
      });
    }
  }

  const totalReports = debits.length + payments.length;

  worksheet.addRow();

  const totalRowValues = [];
  totalRowValues[1] = `VENCIDAS:  ${totalReports}`;

  const cellNum = totalReports + 3;
  const row = worksheet.addRow(totalRowValues);
  row.font = { bold: true, size: 12 };
  worksheet.getCell(`A${cellNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: {argb:'FFFFFF00'} }

  return workbook;
}

const createChargedReport = (fees, payments) => {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(`Cuotas cobradas por banco`);

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'CLIENTE', key: 'client_name', width: 25 },
    { header: 'CÉDULA DE CLIENTE', key: 'client_cedula', width: 20 },
    { header: 'MONTO DE CUOTA', key: 'fee_amount', width: 23 },
    { header: 'EMPRESA', key: 'supplier', width: 35 }
  ];

  worksheet.getRow(1).font = { bold: true, size: 12 };

  if (fees.length > 0) {
    for (let [i, val] of fees.entries()) {
      worksheet.addRow({
        id: i + 1,
        client_name: val.debit.user.firstName.toUpperCase() + ' ' + val.debit.user.lastName.toUpperCase(),
        client_cedula: val.debit.user.cedula,
        fee_amount: Number(val.debit.feeAmount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        supplier: val.debit.supplier.name
      });
    }
  }

  if (payments.length > 0) {
    for (let [i, val] of payments.entries()) {
      worksheet.addRow({
        id: fees.length + (i + 1),
        client_name: val.user.firstName + ' ' + val.user.lastName,
        client_cedula: val.user.cedula,
        fee_amount: Number(val.amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        supplier: val.supplier.name
      });
    }
  }

  worksheet.addRow();

  const totals = getTotalFromFees(fees, payments);

  const totalRowValues = [];
  totalRowValues[1] = `CUOTAS:  ${totals.totalReports}`;
  totalRowValues[4] = `COBRADO:  ${totals.totalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;
  const cellNum =  totals.totalReports + 3;

  const row = worksheet.addRow(totalRowValues);
  row.font = { bold: true, size: 12 };

  worksheet.mergeCells(`A${cellNum}`, `B${cellNum}`);
  worksheet.getCell(`D${cellNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: {argb:'FFFFFF00'} }

  return workbook;
}

function getTotalFromFees(fees, payments) {
  const totalReports = fees.length + payments.length;
  let totalPrice = 0;

  for (fee of fees) {
    totalPrice += +fee.debit.feeAmount;
  }

  for (payment of payments) {
    totalPrice += +payment.amount;
  }

  return { totalReports, totalPrice }
}

module.exports = {
  generateSiserFile,
  createPendingReport,
  createExpiredReport,
  createChargedReport
}