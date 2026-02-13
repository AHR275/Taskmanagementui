import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import nodemailer from "nodemailer";
import dns from "dns";


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


dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
  tls: {
    servername: "smtp.gmail.com",
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});


export async function sendEmail({ to, subject, html }) {
  return await transporter.sendMail({
    from: `"Etmam" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}