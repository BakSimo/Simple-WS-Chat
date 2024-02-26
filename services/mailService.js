const nodemailer = require("nodemailer");
const data = require("../config");

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: data.SMTP_HOST,
      port: data.SMTP_PORT,
      secure: false,
      auth: {
        user: data.SMTP_USER,
        pass: data.SMTP_PASSWORD,
      },
    });
  }

  async sendActivationMail(to, link) {
    await this.transporter.sendMail({
      from: data.SMTP_USER,
      to: to,
      subject: "Accaunt activation " + data.API_URL,
      text: "",
      html: `
               <div><h1>To activate, follow the link</h1><a href="${link}">${link}</a></div>
               `,
    });
  }
}

module.exports = new MailService();
