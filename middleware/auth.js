const jwt = require("jsonwebtoken");
// const { auth } = require('google-auth-library');
// const client = auth.fromAPIKey('');
const publicKey = process.env.PUBLIC_JWT.replace(/\\n/gm, "\n");
const privateKey = process.env.PRIVATE_JWT.replace(/\\n/gm, "\n");

module.exports = {
  sign: (payload, options) => {
    options = {
      issuer: "Pago INSIBS Server",
      subject: "admin@pagos.insibs.com",
      audience: payload.user.email,
    };

    const signOptions = {
      issuer: options.issuer,
      subject: options.subject,
      audience: options.audience,
      expiresIn: "24h",
      algorithm: "RS256",
    };

    return jwt.sign(payload, privateKey, signOptions);
  },

  signGoogle: async (idToken) => {
    // const res = await client.verifyIdToken({ idToken });
    // return res.getPayload();
    return "hello";
  },

  signAdmin: (payload, options) => {
    options = {
      issuer: "Pago INSIBS Server",
      subject: "admin@pagos.insibs.com",
      audience: payload.user.cedula,
    };

    const signOptions = {
      issuer: options.issuer,
      subject: options.subject,
      audience: options.audience,
      expiresIn: "8h",
      algorithm: "RS256",
    };

    return jwt.sign(payload, privateKey, signOptions);
  },

  verify: (req, res, next) => {
    // get token from header
    const token = req.header("x-auth-token");

    // verify the token existance
    if (!token) {
      const error = new Error("Autorización denegada");
      error.statusCode = 401;
      throw error;
    }

    const verifyOptions = {
      issuer: "Pago INSIBS Server",
      subject: "admin@pagos.insibs.com",
      algorithm: ["RS256"],
    };

    try {
      // Decode token
      const decoded = jwt.verify(token, publicKey, verifyOptions);
      req.user = decoded.user;
      next();
    } catch (error) {
      if (!error.statusCode) error.statusCode = 500;
      next(error);
    }
  },
};
