// import sendEmail from "../../shared/resend.js";
import { sendEmail } from "../../shared/gmail.js";

export function verificationEmailTemplate(verifyUrl, userName ) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Verify your email</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h2 style="margin:0; color:#111827;">Verify Your Email</h2>
              </td>
            </tr>

            <!-- Body Text -->
            <tr>
              <td style="color:#4b5563; font-size:16px; line-height:1.6;">
                <p style="margin:0 0 16px;">Hi ${userName},</p>
                <p style="margin:0 0 16px;">
                  Thanks for signing up! Please confirm your email address by clicking the button below.
                </p>
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td align="center" style="padding:30px 0;">
                <a href="${verifyUrl}" 
                   style="background-color:#2563eb; color:#ffffff; text-decoration:none; 
                          padding:14px 28px; border-radius:6px; font-size:16px; 
                          display:inline-block; font-weight:bold;">
                  Verify Email
                </a>
              </td>
            </tr>

            <!-- Fallback Link -->
            <tr>
              <td style="color:#6b7280; font-size:14px; line-height:1.6;">
                <p style="margin:0 0 10px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="word-break:break-all; color:#2563eb;">
                  ${verifyUrl}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding-top:30px; color:#9ca3af; font-size:13px; text-align:center;">
                <p style="margin:0;">
                  If you didn’t create an account, you can safely ignore this email.
                </p>
                <p style="margin:8px 0 0;">
                  © ${new Date().getFullYear()} Task App. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}



export async function sendVerificationEmail({ to, verifyUrl,username }) {
  // Replace this with Postmark/SendGrid/Mailgun/SES
  // Example content:

// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
  const html = verificationEmailTemplate(verifyUrl,username)
  const res= await sendEmail({to,  subject:'Verify Your Email', html})
  console.log(res);
  // console.log("Message sent:", info.messageId, info.accepted);


  // provider.send({ to, subject, text })
//   console.log("SEND EMAIL:", { to, subject, text });
}
// await sendVerificationEmail({to:"hhhh",verifyUrl:"hhhh"})