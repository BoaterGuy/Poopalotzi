import sgMail from '@sendgrid/mail';

// Security check for API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️  SENDGRID_API_KEY environment variable is not set. Email functionality will be simulated.");
  console.warn("📋 To enable real email delivery, add your SendGrid API key to Replit Secrets:");
  console.warn("   1. Go to Replit Secrets tab");
  console.warn("   2. Add key: SENDGRID_API_KEY");
  console.warn("   3. Add value: your_sendgrid_api_key_here");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

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
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com';
  
  if (!isValidEmail(fromEmail)) {
    console.error("❌ Invalid sender email address:", fromEmail);
    return false;
  }
  
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('📧 Email simulation mode (SendGrid):');
      console.log(`   From: ${fromEmail}`);
      console.log(`   To: ${params.to}`);
      console.log(`   Subject: ${params.subject}`);
      console.log(`   Body: ${params.text || params.html?.substring(0, 200) + '...'}`);
      console.log('💡 Add SENDGRID_API_KEY to Replit Secrets to enable real email delivery');
      return true;
    }
    
    // Secure logging (no sensitive data)
    console.log('🔍 SendGrid Configuration:');
    console.log('- API Key configured:', !!process.env.SENDGRID_API_KEY);
    console.log('- From email:', fromEmail);
    console.log('- To email:', params.to);
    console.log('- Subject:', params.subject);
    console.log('- Has text content:', !!params.text);
    console.log('- Has HTML content:', !!params.html);
    
    // Prepare email data for SendGrid
    const msg = {
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };
    
    // Send email via SendGrid
    const response = await sgMail.send(msg);
    
    console.log('✅ Email sent successfully via SendGrid!');
    console.log('📧 Response status:', response[0].statusCode);
    
    return true;
  } catch (error) {
    console.error('❌ SendGrid email error:', error);
    
    // Additional error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    // Graceful fallback to simulation mode if SendGrid fails
    console.log('🔄 Falling back to email simulation mode due to SendGrid error:');
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
    
    return false;
  }
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
      from: process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
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