const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { verify } = require("../../../middleware/auth");
// controllers
const adminUserController = require("../../../controllers/admin/users");

// @route  GET admin/users
// @desc   Get all users (with administrator roles)
// @access Private
router.get("/", verify, adminUserController.getUsers);

// @route  GET admin/users/:id
// @desc   Get user info by id (with administrator roles)
// @access Private
router.get("/:id", verify, adminUserController.getUserProfile);

// @route  POST admin/users
// @desc   Register new user with admin roles
// @access Private
router.post(
  "/",
  [
    verify,
    [
      check("first_name", "el nombre es obligatoria.").unescape().not().isEmpty(),
      check("last_name", "el apellido es obligatoria.").unescape().not().isEmpty(),
      check("cedula", "la cédula es obligatoria.").not().isEmpty(),
      check("email", "Debes colocar un correo válido.").isEmail(),
      check("password", "la contraseña debe iniciar con 1 mayuscula y contener al menos 1 número. Al menos 6 caracteres y un carácter especial (@#$%^*).").matches(
        /^(?=.*\d)(?=.*[a-zA-Z])[A-Za-z\d!@#$%^&*+=]{6,15}$/
      ),
      check("role_id", "El rol del usuario es obligatorio.").not().isEmpty(),
    ],
  ],
  adminUserController.createUser
);

// @route  PUT admin/users/:id
// @desc   Edit user information (only users with administration roles)
// @access Private
router.put(
  "/:id",
  [
    verify,
    [
      check("password")
        .optional({ checkFalsy: true })
        .matches(/^(?=.*\d)(?=.*[a-zA-Z])[A-Za-z\d!@#$%^&*+=]{6,15}$/)
        .withMessage("La contraseña debe ser entre 6 a 15 caracteres, contener al menos 1 mayuscula, 1 número y un caracter especial (@#$%^*)"),
      check("role_id", "Debes seleccionar una contraseña").optional({ checkFalsy: true }),
    ],
  ],
  adminUserController.editUser
);

// @route  DELETE admin/users/:id
// @desc   Delete user
// @access Private
router.delete("/:id", verify, adminUserController.deleteUser);

module.exports = router;
