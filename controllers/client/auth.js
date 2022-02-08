const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const { sign, signGoogle } = require("../../middleware/auth");
const { validationResult } = require("express-validator");

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.statusCode = 422;
      throw error;
    }

    // Check if email exists
    const user = await User.findOne({ where: { email } });

    if (!user) {
      const error = new Error("El email y/o la contraseña ingresados son incorrectos.");
      error.statusCode = 401;
      throw error;
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.hash);

    if (!isMatch) {
      const error = new Error("El email y/o la contraseña ingresados son incorrectos.");
      error.statusCode = 401;
      throw error;
    }

    // update login time
    await user.update({ lastLogin: new Date() });

    const payload = {
      user: {
        id: user.id,
        name: user.firstName + " " + user.lastName,
        pay_id: user.username,
        cedula: user.cedula,
        email: user.email,
      },
    };

    const token = { token: sign(payload) };

    return res.json(token);
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  const { tokenId } = req.body;

  try {
    const googleUser = await signGoogle(tokenId);

    // Check if email exists
    const user = await User.findOne({ where: { email: googleUser.email } });

    if (!user) return res.json({ registered: false, user: googleUser });

    const payload = {
      user: {
        id: user.id,
        name: user.firstName + " " + user.lastName,
        cedula: user.cedula,
        email: user.email,
      },
    };

    const token = { token: sign(payload) };

    return res.json({ registered: true, token });
  } catch (error) {
    error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  loginUser,
  googleLogin,
};
