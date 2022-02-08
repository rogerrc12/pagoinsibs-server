const jwt = require("jsonwebtoken"),
  generateRSAKeyPair = require("generate-rsa-keypair"),
  { auth } = require("google-auth-library"),
  client = auth.fromAPIKey("");

const keyPair = generateRSAKeyPair(),
  publicKey = keyPair.public,
  privateKey = keyPair.private;

let algorithm = process.env.NODE_EV !== "production" ? "HS256" : "RS256";

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
      expiresIn: "1h",
      algorithm,
    };

    return jwt.sign(payload, process.env.NODE_EV !== "production" ? "shhhhh" : privateKey, signOptions);
  },

  signGoogle: async (idToken) => {
    const res = await client.verifyIdToken({ idToken });
    return res.getPayload();
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
      algorithm,
    };

    return jwt.sign(payload, process.env.NODE_EV !== "production" ? "shhhhh" : privateKey, signOptions);
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
      algorithm,
    };

    try {
      // Decode token
      const decoded = jwt.verify(token, process.env.NODE_EV !== "production" ? "shhhhh" : publicKey, verifyOptions);
      req.user = decoded.user;
      next();
    } catch (error) {
      if (!error.statusCode) error.statusCode = 500;
      next(error);
    }
  },
};
