import nodemailer from "nodemailer";

const sendMail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NEXT_PUBLIC_MAILER_ID,
      pass: process.env.NEXT_PUBLIC_MAILER_PASS,
    },
  });

  const mailOptions = {
    from: process.env.NEXT_PUBLIC_MAILER_ID,
    to,
    subject,
    html,
  };

  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve(info);
        return true;
      }
    });
  });
};

export { sendMail };
