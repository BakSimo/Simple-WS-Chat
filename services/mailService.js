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
      <div>
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap");
  
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "Noto Sans", sans-serif;
        }
  
        a:hover {
          background-color: #c70452 !important;
        }
      </style>
      <div style="      
      display: flex; 
      width: 100%;
      height:500px;">          
        <div style="          
        width: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;">
          <h1 style="margin-bottom: 20px">Click to active button</h1>
          <a
            style="
              background-color: #ff0066;
              padding: 15px 20px;
              text-decoration: none;
              color: #ffffff;
            "
            href="${link}"
            >Active</a
          >
        </div>
        <div style="          
        position: relative;
        width: 50%; 
        height: 100%">
          <img  style="
          position: absolute;
          top:0;
          left:0;
          width: 100%; 
          object-fit: cover"
            src="https://i.ibb.co/m9WHQfH/phone-prototype-w.png"
            alt="phone"
          />
        </div>
      </div>
    </div>
               `,
    });
  }
}

module.exports = new MailService();
