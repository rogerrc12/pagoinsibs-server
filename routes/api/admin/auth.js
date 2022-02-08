const express = require("express");
const router = express.Router();
const { verify } = require("../../../middleware/auth");
const { check, body } = require("express-validator");
// controllers
const authController = require("../../../controllers/admin/auth");

// @route  GET admin/auth
// @desc   Get Admin data
// @access Private
router.get("/", verify, authController.getData);

// @route  POST admin/auth
// @desc   Login Admin
// @access Public
router.post(
  "/",
  [
    check("email", "Ingrese un usuario válido.").not().isEmpty(),
    body("password").trim(),
    check("password", "Contraseña inválida.").matches(/^(?=.*\d)(?=.*[a-zA-Z])[A-Za-z\d!@#$%^*+]{6,15}$/),
  ],
  authController.login
);

module.exports = router;
