const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
const { check } = require("express-validator/check");
// controllers
const usersController = require("../../../controllers/client/users");
const authController = require('../../../controllers/client/auth');

// @route  GET api/auth
// @desc   Get user data
// @access Private
router.get("/", verify, usersController.getUserData);

// @route  POST api/auth
// @desc   Grant login user & send token
// @access Public
router.post(
  "/",
  [
    [
      check(
        "email",
        "El correo ingresado es inválido, verifica los datos."
      ).isEmail(),

      check(
        "password",
        "La contraseña ingresada es inválida, verifica los datos."
      ).matches(/^(?=.*\d)(?=.*[a-zA-Z])[A-Za-z\d!@#$%^&*()_\-+=]{6,}$/)
    ]
  ],
    authController.loginUser
);

// @route  POST api/auth/google-oauth
// @desc   Grant login user & send token
// @access Public
router.post("/google-oauth", authController.googleLogin);

module.exports = router;
