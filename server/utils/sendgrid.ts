// server/utils/sendgrid.ts
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string; // optional, defaults to env
}

export async function sendServiceStatusEmail(
  to: string,
  name: string,
  subject: string,
  text: string
) {
  const from = process.env.SENDGRID_FROM || "no-reply@poopalotzi.com";
  const html = `<p>Hi ${name},</p><p>${text}</p>`;
  const msg = {
    to,
    from,
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (err) {
    console.error("Error sending email via SendGrid:", err);
    return false;
  }
}