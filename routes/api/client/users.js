const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
const { check, body } = require("express-validator");
// Controllers
const usersController = require("../../../controllers/client/users");

// @route  POST api/users/reset
// @desc   send email to user for password resetting
// @access Public
router.post("/reset", [check("email", "Debes ingresar un email válido.").isEmail()], usersController.sendPasswordResetToken);

// @route  GET api/users/password
// @desc   validate user for password reset
// @access Private
router.get("/password-reset", usersController.getPasswordReset);

// @route  PUT api/users/password-reset
// @desc   change user's password
// @access Private
router.put(
  "/password-reset",
  [[check("password", "El formato de contraseña es inválido.").matches(/^(?=.*\d)(?=.*[a-zA-Z])[A-Za-z\d!@#$%^&*()_\-+=]{6,}$/i)]],
  usersController.resetPassword
);

// @route  PUT api/users/profile
// @desc   Update current user's profile info
// @access Private
router.put(
  "/profile",
  [
    verify,
    [
      body("address").unescape(),
      check("address", "Ingrese una dirección válida.").not().isEmpty(),
      body("city").unescape(),
      check("city", "Ingrese una ciudad válida.").not().isEmpty(),
      check("phone", "Número de telêfono inválido.").matches(/^((\+[0-9]{1,2})?[-\s]?([0-9]){3,4})[-\s]?([0-9]){3}[-\s]?([0-9]{3,4})$/),
      check("birthday", "Debes ser mayor de edad para usar nuestros servicios.").isBefore(new Date("01/01/2010").toDateString()),
    ],
  ],
  usersController.updateProfile
);

module.exports = router;
