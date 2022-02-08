const express = require("express");
const router = express.Router();
const db = require("../../../config/db");
const moment = require("moment");
const mail = require("../../../mail/config");
const { verify } = require("../../../middleware/auth");
const { check, validationResult } = require("express-validator");
// controllers
const { sendPaymentDetails } = require("../../../controllers/client/payments");
const { sendDebitDetails } = require("../../../controllers/client/debits");

//@route POST api/detail/payment/:type/:payment_id
//@desc send payment info PDF to user's email
//access private
router.post("/payment/:type/:payment_id", verify, sendPaymentDetails);

//@route POST api/detail/transfer
//@desc send transfer info PDF to user's email
//access private
router.post("/transfer", [verify, [check("email", "Debes ingresar un correo electrónico válido.").isEmail()]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
    });
  }

  const { email, transfer_id } = req.body;

  try {
    const transfer = await db("users_transfers").where({ id: transfer_id });

    if (transfer.length > 0) {
      const receiver = await db("users").where({ id: transfer[0].user_received_id });

      const options = {
        email,
        subject: `Detalle de la operación no. ${transfer_id}`,
        template: "transfer_detail",
        variables: JSON.stringify({
          name: req.user.name,
          transfer_id,
          description: transfer[0].description,
          amount: Number(transfer[0].amount).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Bs.",
          acc_number: `termina en ${transfer[0].acc_number.substring(15, 20)}`,
          bank_name: transfer[0].bank_name,
          acc_type: transfer[0].acc_type,
          date_issued: moment(transfer[0].date_issued).format("DD-MM-YYYY hh:mm a"),
          receiver_name: receiver[0].first_name + " " + receiver[0].last_name,
          receiver_payid: receiver[0].pay_id,
        }),
      };

      res.send(await mail.send(options));
    } else {
      return res
        .status(404)
        .json({
          errors: [
            { msg: "Ha ocurrido un error. Al parecer esta transacción no se encuentra registrada, verifica tu conexión a internet o contacta a soporte si el error continua." },
          ],
        });
    }
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ errors: [{ msg: "Ha ocurrido un error, pero es todo lo que sabemos. Por favor, verifica tu conexión a internet o contacta a soporte si el error continua." }] });
  }
});

//@route POST api/detail/debit/:debit_id
//@desc send debit info PDF to user's email
//access private
router.post("/debit/:debit_id", verify, sendDebitDetails);

module.exports = router;
