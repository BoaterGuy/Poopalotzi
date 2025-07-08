import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will be simulated.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Use the from email from environment or default
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com';
    
    if (!process.env.SENDGRID_API_KEY) {
      console.log('Email simulation mode:');
      console.log(`From: ${fromEmail}`);
      console.log(`To: ${params.to}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Body: ${params.text || params.html}`);
      return true;
    }
    
    await mailService.send({
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendContactFormEmail(
  name: string,
  email: string,
  phone: string | undefined,
  subject: string,
  message: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@poopalotzi.com';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Poopalotzi</h1>
        <p style="color: #F4EBD0; margin: 5px 0 0 0;">New Contact Form Submission</p>
      </div>
      <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
        <h2 style="color: #0B1F3A; margin-top: 0;">Contact Details</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        
        <h3 style="color: #0B1F3A;">Message</h3>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6B6B; margin: 10px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Reply directly to this email to respond to ${name}.
        </p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© 2024 Poopalotzi. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: adminEmail,
    from: process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
    subject: `Contact Form: ${subject}`,
    html,
    text: `New contact form submission from ${name} (${email})${phone ? `\nPhone: ${phone}` : ''}\n\nSubject: ${subject}\n\nMessage:\n${message}`,
  });
}

export async function sendServiceStatusEmail(
  email: string,
  firstName: string,
  subject: string,
  message: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Poopalotzi</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
        <p style="margin-top: 0;">Hello ${firstName},</p>
        <p>${message}</p>
        <p>You can view the details of your service by logging into your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://poopalazi.com'}/member/service-history" 
             style="background-color: #38B2AC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Service Details
          </a>
        </div>
        <p>Thank you for using Poopalotzi for your boat maintenance needs.</p>
        <p>Best regards,<br>The Poopalotzi Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© 2023 Poopalotzi. All rights reserved.</p>
        <p>123 Marina Way, Seaside, CA 94955</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalazi.com',
    subject,
    html,
  });
}
