const domain = process.env.MAILGUN_DOMAIN;
const apiKey = process.env.MAILGUN_KEY;
const mailgun = require("mailgun-js")({ apiKey, domain });

module.exports = {
  send: async (options) => {
    const data = {
      from: `Pago INSIBS sistema@pagoinsibs.com`,
      to: options.email,
      subject: options.subject,
      template: options.template,
      "o:require-tls": "True",
      "h:X-Mailgun-Variables": options.variables,
    };

    if (options.attachment) {
      const file = new mailgun.Attachment({
        data: options.attachment,
        filename: options.filename,
        contentType: "application/pdf",
        knownLength: options.attachment.length,
      });

      data.attachment = file;
    }

    try {
      const sent = await mailgun.messages().send(data);
      return sent.id ? true : false;
    } catch (error) {
      console.log(error);
      if (!error.statusCode) error.statusCode = 500;
      throw error;
    }
  },
};
