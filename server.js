require("dotenv").config();
const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./helpers/logger");
const { relateTables, createSequencesTables } = require("./config/dbFunctions");
const app = express();
app.set("trust proxy", true);

// Apply json middleware
app.use(express.json());
app.use(
  cors({
    exposedHeaders: ["X-Suggested-Filename", "Content-Disposition"],
  })
);
app.use(helmet());

app.use("/api/users", require("./routes/api/client/users"));
app.use("/api/auth", require("./routes/api/client/auth"));
app.use("/api/banks", require("./routes/api/client/banks"));
app.use("/api/validation", require("./routes/api/client/validation"));
app.use("/api/payments", require("./routes/api/client/payments"));
app.use("/api/debits", require("./routes/api/client/debits"));
app.use("/api/transfers", require("./routes/api/client/transfers"));
app.use("/api/detail", require("./routes/api/client/details"));
app.use("/api/accounts", require("./routes/api/client/accounts"));
app.use("/api/suppliers", require("./routes/api/client/suppliers"));

// Admin routes
app.use("/api/admin/users", require("./routes/api/admin/users"));
app.use("/api/admin/subscribers", require("./routes/api/admin/subscribers"));
app.use("/api/admin/suppliers", require("./routes/api/admin/suppliers"));
app.use("/api/admin/products", require("./routes/api/admin/products"));
app.use("/api/admin/payments", require("./routes/api/admin/payments"));
app.use("/api/admin/debits", require("./routes/api/admin/debits"));
app.use("/api/admin/auth", require("./routes/api/admin/auth"));
app.use("/api/admin/bank-payments", require("./routes/api/admin/bankPayments"));
app.use("/api/admin/reports", require("./routes/api/admin/reports"));

app.use((error, req, res, next) => {
  logger.error(error);
  console.log(error);
  const status = error.statusCode || 500;
  const message =
    error.statusCode !== 500
      ? error.message
      : "Ha ocurrido un error inserperado. verifica tu conexión a internet e intenta de nuevo. Si el problema persiste, por favor contacta a soporte.";

  return res.status(status).json({ message });
});

(async function () {
  const PORT = process.env.PORT || 5000;

  try {
    await relateTables();
    await db.sync();
    await db.authenticate();
    await createSequencesTables();

    console.log("connected to database...");

    app.listen(PORT, () => console.log(`App listening on PORT ${PORT}`));
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
})();
