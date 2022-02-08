const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
const { check, body } = require("express-validator");
// controllers
const usersController = require("../../../controllers/client/users");
const authController = require("../../../controllers/client/auth");

// @route  GET api/auth
// @desc   Get user data
// @access Private
router.get("/", verify, usersController.getUserData);

// @route  POST api/auth/register/step-1
// @desc   Register user
// @access Public
router.post(
  "/register/step-1",
  [
    [
      body("first_name", "Debes ingresar un nombre válido.").not().isEmpty().trim().unescape(),

      body("last_name", "Debes ingresar un apellido válido.").not().isEmpty().trim().unescape(),

      body("email", "Por favor, ingrese un email válido.").isEmail(),

      body("secondaryEmail", "Por favor, ingrese un email secundario válido.").isEmail(),
    ],
  ],
  usersController.startUserRegistration
);

// @route  POST api/auth/register/step-2
// @desc   Register user
// @access Public
router.post(
  "/register/step-2",
  [
    [
      body("ci_number")
        .not()
        .isEmpty()
        .withMessage("Hay un error en el formulario (debes ingresar una cédula).")
        .matches(/^[0-9]{7,9}$/i)
        .withMessage("Por favor, ingrese una cédula válida."),

      body("username", "El nombre de pago solo debe ser de letras y números.").matches(/^(?=.*\d)(?=.*[a-zA-Z])[A-Za-z\d]{4,12}$/i),

      body("password", "La contraseña debe tener al menos una letra y un número, minimo de 6 caracteres.").matches(/^(?=.*\d)(?=.*[a-zA-Z])[A-Za-z\d!@#$%^&*()_\-+=]{6,}$/i),

      body("confirm_password").custom((value, { req }) => {
        if (value !== req.body.password) throw new Error("Las contraseñas deben coincidir.");
        return true;
      }),
    ],
  ],
  usersController.completeUserRegistration
);

// @route  POST api/auth
// @desc   Grant login user & send token
// @access Public
router.post(
  "/",
  [
    [
      check("email", "El correo ingresado es inválido, verifica los datos.").isEmail(),
      check("password", "La contraseña ingresada es inválida, verifica los datos.").not().isEmpty(),
    ],
  ],
  authController.loginUser
);

// @route  POST api/auth/google-oauth
// @desc   Grant login user & send token
// @access Public
router.post("/google-oauth", authController.googleLogin);

module.exports = router;
