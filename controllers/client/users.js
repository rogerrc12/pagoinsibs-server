const User = require('../../models/user');
const bcrypt = require("bcryptjs");
const { v4 } = require("uuid");
const nanoid = require("nanoid/async/generate");
const mail = require("../../mail/config");
const { sign } = require("../../middleware/auth");
const { validationResult } = require("express-validator/check");

const updateProfile = async (req, res, next) => {
  const { address, city, phone, birthday, gender } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }
    
    const userInfo = await User.findByPk(req.user.id);
    
    await User
      .update({
        address: address ? address : userInfo.address,
        city: city ? city : userInfo.city,
        phone: phone ? phone : userInfo.phone,
        birthday: birthday ? new Date(birthday) : userInfo.birthday,
        gender: gender ? gender : userInfo.gender,
        profileCompleted: true
      }, {where: {id: req.user.id}});
  
    const updatedUser = await User.findByPk(req.user.id);
  
    return res.json(updatedUser);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  const { first_name, last_name, ci_type, ci_number, email, username, password } = req.body;

  try {
    // Validation test
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    // generate client id
    const client_id = await nanoid("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

    // create user instance
    const newUser = {
      firstName: first_name.toLowerCase(),
      lastName: last_name.toLowerCase(),
      cedula: ci_type + ci_number,
      email,
      username: username.toLowerCase(),
      hash,
      clientId: "IN" + client_id,
      roleId: 4
    };

    // Insert user in DB
    const user = await User.create(newUser);

    // JWT - Create token for new user
    const payload = {
      user: {
        id: user.id,
        name: user.firstName + " " + user.lastName,
        email: user.email,
        pay_id: user.username,
        cedula: user.cedula,
      },
    };

    const token = { token: sign(payload) };

    res.json(token);

    const options = {
      email: user.email,
      subject: "Bienvenido a pago INSIBS, registro exitoso!",
      template: "welcome_message",
      variables: JSON.stringify({ name: user.firstName }),
    };

    return await mail.send(options);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const getUserData = async (req, res, next) => {

  try {
    const user = await User.findByPk(req.user.id);

    return res.json(user);
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

const sendPasswordResetToken = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const { email } = req.body;

    const user = await User.findOne({ where: {email} });

    if (!user) {
      const error = new Error("No se ha encontrado una cuenta asociada a este correo.");
      error.statusCode = 404;
      throw error;
    }

    const token = v4();
    const expDate = new Date();
    expDate.setHours(expDate.getHours() + 1);
    const TWO_MIN = 2 * 60 * 1000;

    if (user.resetTokenExp) {
      if (expDate - new Date(user.resetTokenExp) <= TWO_MIN) {
        const error = new Error("Debes esperar unos minutos para enviarlo nuevamente.");
        error.statusCode = 409;
        throw error;
      }
    }

    await user.update({ resetToken: token, resetTokenExp: expDate });

    const mailOptions = {
      email: user.email,
      subject: "Solicitud de reinicio de contraseña",
      template: "password_reset",
      variables: JSON.stringify({
        name: user.firstName,
        resetLink: `https://pagoinsibs.com/password-reset?reset=true&reset_token=${user.resetToken}` 
      }),
    };

    await mail.send(mailOptions);

    return res.status(200).json({ message: "Mensaje enviado!" });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const getPasswordReset = async (req, res, next) => {
  const { reset, reset_token } = req.query;

  try {

    if (!reset) {
      const error = new Error("Esta acción no está permitida.");
      error.statusCode = 409;
      throw error;
    }

    const user = await User.findOne({ where: {resetToken: reset_token} })

    if (!user) {
      const error = new Error("No se encuentra el usuario o el link ha expirado.");
      error.statusCode = 404;
      throw error;
    }

    const expirationStatus = new Date(user.resetTokenExp) > new Date();

    if (!expirationStatus) {
      const error = new Error("No se encuentra el usuario o el link ha expirado.");
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({ email: user.email });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 12);

    await User.update({ hash }, { where: {email} });

    res.status(200).json({ message: 'La contraseña fue cambiada de forma exitosa.' });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getUserData,
  updateProfile,
  registerUser,
  sendPasswordResetToken,
  getPasswordReset,
  resetPassword
};
