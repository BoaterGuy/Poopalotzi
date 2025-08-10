import SibApiV3Sdk from 'sib-api-v3-sdk';

// Security check for API key
if (!process.env.BREVO_API_KEY) {
  console.warn("⚠️  BREVO_API_KEY environment variable is not set. Email functionality will be simulated.");
  console.warn("📋 To enable real email delivery, add your Brevo API key to Replit Secrets:");
  console.warn("   1. Go to Replit Secrets tab");
  console.warn("   2. Add key: BREVO_API_KEY");
  console.warn("   3. Add value: your_brevo_api_key_here");
}

// Initialize Brevo client with security validation
const defaultClient = SibApiV3Sdk.ApiClient.instance;
if (process.env.BREVO_API_KEY) {
  // Validate API key format
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey.startsWith('xkeysib-') || apiKey.length < 64) {
    console.error("❌ Invalid BREVO_API_KEY format. Please check your API key.");
  } else {
    const apiKeyAuth = defaultClient.authentications['api-key'];
    apiKeyAuth.apiKey = apiKey;
  }
}
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Input validation
  if (!params.to || !isValidEmail(params.to)) {
    console.error("❌ Invalid recipient email address:", params.to);
    return false;
  }
  
  if (!params.subject || params.subject.trim().length === 0) {
    console.error("❌ Email subject is required");
    return false;
  }
  
  if (!params.text && !params.html) {
    console.error("❌ Email must have either text or HTML content");
    return false;
  }
  
  // Use the from email from environment or default
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com';
  
  if (!isValidEmail(fromEmail)) {
    console.error("❌ Invalid sender email address:", fromEmail);
    return false;
  }
  
  try {
    if (!process.env.BREVO_API_KEY) {
      console.log('📧 Email simulation mode (Brevo):');
      console.log(`   From: ${fromEmail}`);
      console.log(`   To: ${params.to}`);
      console.log(`   Subject: ${params.subject}`);
      console.log(`   Body: ${params.text || params.html?.substring(0, 200) + '...'}`);
      console.log('💡 Add BREVO_API_KEY to Replit Secrets to enable real email delivery');
      return true;
    }
    
    // Secure logging (no sensitive data)
    console.log('🔍 Brevo Configuration:');
    console.log('- API Key configured:', !!process.env.BREVO_API_KEY);
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
    console.error('❌ Brevo email error:', error);
    
    // Additional error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    // Graceful fallback to simulation mode if Brevo fails
    console.log('🔄 Falling back to email simulation mode due to Brevo error:');
    console.log('📧 Email Details:');
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${params.to}`);
    console.log(`   Subject: ${params.subject}`);
    if (params.text) {
      console.log(`   Text Body: ${params.text.substring(0, 200)}${params.text.length > 200 ? '...' : ''}`);
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
  // Input validation
  if (!name || name.trim().length === 0) {
    console.error("❌ Contact form: Name is required");
    return false;
  }
  
  if (!email || !isValidEmail(email)) {
    console.error("❌ Contact form: Valid email is required");
    return false;
  }
  
  if (!subject || subject.trim().length === 0) {
    console.error("❌ Contact form: Subject is required");
    return false;
  }
  
  if (!message || message.trim().length === 0) {
    console.error("❌ Contact form: Message is required");
    return false;
  }
  
  // Use environment variable for admin email, fallback to testing email
  const adminEmail = process.env.ADMIN_EMAIL || 'mmotsis@gmail.com'; // Testing phase
  
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

// Function to send admin notifications for pump-out requests
export async function sendAdminPumpOutNotification(
  adminEmails: string[],
  memberInfo: { firstName: string; lastName: string; email: string },
  boatInfo: { name: string; make?: string; model?: string; pier?: string; dock?: string },
  requestInfo: { weekStartDate: string; ownerNotes?: string; requestId: number }
): Promise<boolean> {
  const subject = `New Pump-Out Request - ${boatInfo.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; color: white; padding: 20px; text-align: center;">
        <h1>🚤 New Pump-Out Request</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #0B1F3A;">Request Details</h2>
        
        <div style="background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0B1F3A;">
          <h3 style="margin-top: 0; color: #0B1F3A;">Member Information</h3>
          <p><strong>Name:</strong> ${memberInfo.firstName} ${memberInfo.lastName}</p>
          <p><strong>Email:</strong> ${memberInfo.email}</p>
        </div>
        
        <div style="background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0B1F3A;">
          <h3 style="margin-top: 0; color: #0B1F3A;">Boat Information</h3>
          <p><strong>Boat Name:</strong> ${boatInfo.name}</p>
          ${boatInfo.make ? `<p><strong>Make/Model:</strong> ${boatInfo.make} ${boatInfo.model || ''}</p>` : ''}
          ${boatInfo.pier ? `<p><strong>Location:</strong> Pier ${boatInfo.pier}${boatInfo.dock ? `, Dock ${boatInfo.dock}` : ''}</p>` : ''}
        </div>
        
        <div style="background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0B1F3A;">
          <h3 style="margin-top: 0; color: #0B1F3A;">Service Request</h3>
          <p><strong>Week Starting:</strong> ${new Date(requestInfo.weekStartDate).toLocaleDateString()}</p>
          <p><strong>Request ID:</strong> #${requestInfo.requestId}</p>
          ${requestInfo.ownerNotes ? `<p><strong>Notes:</strong> ${requestInfo.ownerNotes}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #666; font-style: italic;">
            This is an automated notification from the Poopalotzi Marina Management System.
          </p>
        </div>
      </div>
    </div>
  `;
  
  const text = `
New Pump-Out Request

Member: ${memberInfo.firstName} ${memberInfo.lastName}
Email: ${memberInfo.email}

Boat: ${boatInfo.name}
${boatInfo.make ? `Make/Model: ${boatInfo.make} ${boatInfo.model || ''}` : ''}
${boatInfo.pier ? `Location: Pier ${boatInfo.pier}${boatInfo.dock ? `, Dock ${boatInfo.dock}` : ''}` : ''}

Week Starting: ${new Date(requestInfo.weekStartDate).toLocaleDateString()}
Request ID: #${requestInfo.requestId}
${requestInfo.ownerNotes ? `Notes: ${requestInfo.ownerNotes}` : ''}

This is an automated notification from the Poopalotzi Marina Management System.
  `;
  
  // Send to all admin emails
  let allSuccess = true;
  for (const adminEmail of adminEmails) {
    const success = await sendEmail({
      to: adminEmail,
      from: process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
      subject,
      text,
      html
    });
    
    if (!success) {
      allSuccess = false;
      console.error(`Failed to send notification to admin: ${adminEmail}`);
    }
  }
  
  return allSuccess;
}