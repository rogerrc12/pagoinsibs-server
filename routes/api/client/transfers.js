const express = require("express");
const router = express.Router();
const moment = require("moment");
const { verify } = require("../../../middleware/auth");
const mail = require("../../../mail/config");
const db = require("../../../config/db");
const { check, validationResult, body } = require("express-validator");
// controllers
const { getUserByEmail } = require("../../../controllers/client/users");
const { getTransfers } = require("../../../controllers/client/transfers");

// @route  GET api/transfers
// @desc   Get all transfers
// @access Private
router.get("/", verify, async (req, res) => {
  try {
    const transfers = await getTransfers(req.user);
    res.json(transfers);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      errors: [
        {
          msg: "Algo ha ido mal! lamentamos las molestias, por favor intentalo más tarde.",
        },
      ],
    });
  }
});

// @route  GET api/transfers/:id
// @desc   Get all transfers
// @access Private
router.get("/:id", verify, async (req, res) => {
  const { id } = req.params;

  try {
    const transfer = await db("users_transfers as ut")
      .select(["ut.*", "u.cedula", "u.pay_id", "u.email", "u.first_name", "u.last_name"])
      .join("users as u", {
        "ut.user_received_id": "u.id",
      })
      .where({ "ut.id": id });

    if (transfer === 0) {
      return res.status(404).json({ errors: [{ msg: "No se pudo obtener el detalle de este pago, por favor intentalo más tarde." }] });
    }

    res.json(transfer[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ errors: [{ msg: "Algo ha ido mal! lamentamos las molestias, por favor intentalo más tarde." }] });
  }
});

// @route  POST api/transfers/send-transfer
// @desc   Make & Create a new transfer
// @access Private
router.post(
  "/send-transfer",
  [
    verify,
    [
      body("description").unescape(),
      check("pay_id", "El nombre de pago ingresado es incorrecto. Por favor intentalo nuevamente.").isLength({ min: 4, max: 12 }),
      check("description", "Hay un error en el formulario (la descripción es obligatoria).").not().isEmpty(),
      check("amount", "El monto ingresado es incorrecto, el formato es inválido. Por favor intentalo nuevamente.").isCurrency(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    const { description, amount, pay_id, account_id } = req.body;

    try {
      // Check for receiver pay ID existance
      const userReceiver = await db.select("*").from("users").where({ pay_id: pay_id.toLowerCase() });
      if (userReceiver.length === 0) {
        return res.status(404).json({
          errors: [
            {
              msg: "El nombre de pago ingresado no se encuentra registrado. Por favor, verificalo e intentalo nuevamente.",
            },
          ],
        });
      }

      // check if receiver has accounts to receive listed
      const receiverAccounts = await db("accounts_to_receive").where({ user_id: userReceiver[0].id });

      if (receiverAccounts.length === 0) {
        return res.status(404).json({
          errors: [
            {
              msg: "No puedes realizar esta operación ya que el usuario a enviar no tiene cuentas para recibir. Notificale que agregue una cuenta.",
            },
          ],
        });
      }

      // check if Sender Pay ID not the same as receiver Pay ID
      if (pay_id.toLowerCase() === req.user.pay_id) {
        return res.status(403).json({
          errors: [
            {
              msg: "Lo lamentamos, pero el nombre de pago al cual desea transferir no puede ser su nombre de pago. Por favor, intentalo con un nombre de pago diferente.",
            },
          ],
        });
      }

      // Look for a payment with similar amount and supplier
      const similarTransactions = await db("users_transfers").where({
        amount,
        user_received_id: userReceiver[0].id,
      });

      // check if the payment was done before 5 minutes ago
      if (similarTransactions.length > 0) {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const day = new Date().getDate();
        const hour = new Date().getHours();
        const minutes = new Date().getMinutes() - 5;

        let rejected = false;

        similarTransactions.forEach((transaction) => {
          if (new Date(`${year}/${month}/${day} ${hour}:${minutes}`) <= new Date(transaction.date_issued)) {
            rejected = true;
          }
        });

        if (rejected) {
          return res.status(400).json({
            errors: [
              {
                msg: "Haz realizado una transacción similar hace menos de 5 minutos, deberás esperar al menos 5 minutos para realizar otra similar.",
              },
            ],
          });
        }
      }

      // Get account information
      const account = await db("accounts_to_send").where({ id: account_id });
      const bank = await db("banks").where({ bank_id: account[0].bank_id });

      // Create new transaction constructor
      const transfer = {
        description,
        amount: parseFloat(amount),
        user_id: req.user.id,
        acc_number: account[0].acc_number,
        bank_name: bank[0].bank_name,
        acc_type: account[0].acc_type,
        user_received_id: userReceiver[0].id,
        date_issued: new Date(),
        status_id: 1,
      };

      // send data to database
      const newTransfer = await db("users_transfers").insert(transfer).returning("*");
      const receiver = await db("users").where({ id: newTransfer[0].user_received_id });
      const sender = await db("users").where({ id: newTransfer[0].user_id });

      if (newTransfer.length > 0) {
        const senderOptions = {
          email: req.user.email,
          subject: "Tu transferencia ha sido recibida!",
          template: "transfer_received_sender",
          variables: JSON.stringify({
            name: req.user.name,
            transfer_id: newTransfer[0].id,
            date_issued: moment(newTransfer[0].date_issued).format("DD-MM-YYYY [a las] hh:mm a"),
            amount: Number(newTransfer[0].amount).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Bs. ",
            description: newTransfer[0].description,
            bank_name: newTransfer[0].bank_name,
            acc_number: newTransfer[0].acc_number.substring(15, 20),
            receiver_name: receiver[0].first_name + " " + receiver[0].last_name,
            receiver_cedula: receiver[0].cedula,
          }),
        };

        await mail.send(senderOptions);
      }

      if (receiver.length > 0) {
        const receiverOptions = {
          email: receiver[0].email,
          subject: `${sender[0].first_name + " " + sender[0].last_name} te ha generado una solicitud de transferencia!`,
          template: "transfer_to_receiver",
          variables: JSON.stringify({
            name: receiver[0].first_name,
            sender_name: sender[0].first_name + " " + sender[0].last_name,
            sender_cedula: sender[0].cedula,
            date_issued: moment(newTransfer[0].date_issued).format("DD-MM-YYYY [a las] hh:mm a"),
            amount: Number(newTransfer[0].amount).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Bs. ",
            description: newTransfer[0].description,
          }),
        };

        await mail.send(receiverOptions);
      }

      return res.json(newTransfer[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        errors: [
          {
            msg: "Algo ha ido mal! lamentamos las molestias, por favor intentalo más tarde.",
          },
        ],
      });
    }
  }
);

// @route  POST api/transfers/request-transfer
// @desc   Make & Create a new transfer
// @access Private
router.post("/request-transfer", [verify, [body("description").unescape(), check("email", "Debes ingresar un email válido.").isEmail()]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, description, amount } = req.body;

  try {
    // check if user exists
    const user = await getUserByEmail(email);

    let options;
    if (user.length === 0) {
      options = {
        email,
        subject: `${req.user.name} te ha invitado a unirte a Pago INSIBS`,
        template: "invitation",
        variables: JSON.stringify({ sender_name: req.user.name }),
      };
    } else {
      options = {
        email,
        subject: "Tienes una nueva solicitud de cobro",
        template: "transfer_request",
        variables: JSON.stringify({
          name: user[0].first_name,
          sender_name: req.user.name,
          sender_cedula: req.user.cedula,
          date_issued: moment(new Date()).format("DD-MM-YYYY [a las] hh:mm a"),
          amount: Number(amount).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Bs. ",
          description,
        }),
      };
    }

    res.send(await mail.send(options));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      errors: [{ msg: "Algo ha ido mal! lamentamos las molestias, por favor intentalo más tarde." }],
    });
  }
});

module.exports = router;
