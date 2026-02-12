import { Resend } from "resend";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


if (!process.env.RESEND_API_KEY) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Load .env from project root (adjust if needed)
  dotenv.config({
    path: path.resolve(__dirname, "../process.env"),
  });

  if(!process.env.RESEND_API_KEY){

    throw new Error("RESEND_API_KEY is not set");
  }
  
}

export default async function sendEmail({from='onboarding@resend.dev', to ,subject , html}) {
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    
    const res = await resend.emails.send({
      from,
      to,
      subject,
      html
    });

    return res; 
}
