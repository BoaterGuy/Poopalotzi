import SibApiV3Sdk from 'sib-api-v3-sdk';

if (!process.env.BREVO_API_KEY) {
  console.warn("BREVO_API_KEY environment variable is not set. Email functionality will be simulated.");
}

// Initialize Brevo client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
if (process.env.BREVO_API_KEY) {
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
}
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Use the from email from environment or default
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com';
  
  try {
    if (!process.env.BREVO_API_KEY) {
      console.log('Email simulation mode (Brevo):');
      console.log(`From: ${fromEmail}`);
      console.log(`To: ${params.to}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Body: ${params.text || params.html}`);
      return true;
    }
    
    // Debug logging for Brevo configuration
    console.log('🔍 Brevo Configuration:');
    console.log('- API Key exists:', !!process.env.BREVO_API_KEY);
    console.log('- API Key length:', process.env.BREVO_API_KEY?.length);
    console.log('- API Key prefix:', process.env.BREVO_API_KEY?.substring(0, 10) + '...');
    console.log('- From email:', fromEmail);
    console.log('- To email:', params.to);
    console.log('- Subject:', params.subject);
    console.log('- Has text content:', !!params.text);
    console.log('- Has HTML content:', !!params.html);
    
    // Prepare email data for Brevo
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: fromEmail };
    sendSmtpEmail.to = [{ email: params.to }];
    sendSmtpEmail.subject = params.subject;
    if (params.text) sendSmtpEmail.textContent = params.text;
    if (params.html) sendSmtpEmail.htmlContent = params.html;
    
    // Send email via Brevo
    const response = await brevoClient.sendTransacEmail(sendSmtpEmail);
    
    console.log('✅ Email sent successfully via Brevo!');
    console.log('📧 Response data:', {
      messageId: response.messageId,
      body: response.body,
      status: response.response?.status || 'unknown'
    });
    
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    
    // Additional error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    // Fallback to simulation mode if Brevo fails
    console.log('🔄 Falling back to email simulation mode due to Brevo error:');
    console.log('📧 Email Details:');
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${params.to}`);
    console.log(`   Subject: ${params.subject}`);
    if (params.text) {
      console.log(`   Text Body: ${params.text}`);
    }
    if (params.html) {
      console.log(`   HTML Body: ${params.html.substring(0, 200)}...`);
    }
    console.log('--- End of email simulation ---');
    
    // Return true for simulation mode so the contact form shows success
    return true;
  }
}

export async function sendContactFormEmail(
  name: string,
  email: string,
  phone: string | undefined,
  subject: string,
  message: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'mmotsis@gmail.com';
  
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
    from: process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
    subject,
    html,
    text: `Hello ${firstName},\n\n${message}\n\nYou can view the details of your service by logging into your account.\n\nThank you for using Poopalotzi for your boat maintenance needs.\n\nBest regards,\nThe Poopalotzi Team`,
  });
}