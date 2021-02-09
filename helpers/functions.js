function calculateEndDate(frecuency = null, date, dues) {
  let endDate = new Date(date);

  switch (frecuency) {
    case "semanal":
      endDate.setDate(endDate.getDate() + dues * 7);
      break;
    case "quincenal":
      endDate.setDate(endDate.getDate() + dues * 15);
      break;
    case "mensual":
      endDate.setMonth(endDate.getMonth() + dues);
      break;
    default:
      endDate.setDate(endDate.getDate() + dues);
  }

  return endDate;
}

function addDays(date, days) {
  const newDate = new Date(Number(date));
  newDate.setDate(date.getDate() + days);
  return newDate;
}

function addMonths(date, months) {
  const newDate = new Date(Number(date));
  newDate.setMonth(date.getMonth() + months);
  return newDate;
}

function formatAmount(amount) {
  return Number(amount).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

module.exports = {
  calculateEndDate,
  addDays,
  addMonths,
  formatAmount,
};
