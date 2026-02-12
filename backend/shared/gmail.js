import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Load .env from project root (adjust if needed)
  dotenv.config({
    path: path.resolve(__dirname, "../process.env"),
  });

  if(!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS){

    throw new Error("!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS is not set");
  }
  
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS, // app password (not your normal password)
  },
});

export async function sendEmail({ to, subject, html }) {
  return await transporter.sendMail({
    from: `"Etmam" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}