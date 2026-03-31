import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"Splitr" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}