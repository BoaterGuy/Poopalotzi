import { sendEmail } from './brevo';
import {
  getWelcomeEmailTemplate,
  getSubscriptionConfirmationTemplate,
  getSubscriptionRenewalReminderTemplate,
  getPaymentReceiptTemplate,
  getEmployeeWeeklyScheduleTemplate
} from './email-templates';
import { User, ServiceLevel, Boat, PumpOutRequest } from '@shared/schema';

// Email service to handle all types of notifications

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user: User): Promise<boolean> {
  const html = getWelcomeEmailTemplate(user.firstName);
  
  return sendEmail({
    to: user.email,
    from: process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
    subject: 'Welcome to Poopalotzi',
    html,
  });
}

/**
 * Send confirmation email when user purchases a subscription
 */
export async function sendSubscriptionConfirmationEmail(
  user: User,
  serviceLevel: ServiceLevel,
  startDate: Date,
  endDate: Date | null
): Promise<boolean> {
  const html = getSubscriptionConfirmationTemplate(
    user.firstName,
    serviceLevel.name,
    startDate,
    endDate,
    serviceLevel.price
  );
  
  return sendEmail({
    to: user.email,
    from: process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
    subject: 'Your Poopalotzi Subscription Confirmation',
    html,
  });
}

/**
 * Send subscription renewal reminder
 */
export async function sendSubscriptionRenewalReminderEmail(
  user: User,
  serviceLevel: ServiceLevel,
  expiryDate: Date
): Promise<boolean> {
  const renewalLink = `${process.env.APP_URL || 'https://poopalotzi.com'}/member/service-subscription`;
  
  const html = getSubscriptionRenewalReminderTemplate(
    user.firstName,
    serviceLevel.name,
    expiryDate,
    renewalLink
  );
  
  return sendEmail({
    to: user.email,
    from: process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
    subject: 'Your Poopalotzi Subscription is Expiring Soon',
    html,
  });
}

/**
 * Send payment receipt
 */
export async function sendPaymentReceiptEmail(
  user: User,
  boat: Boat,
  request: PumpOutRequest,
  serviceName: string,
  amount: number,
  invoiceNumber: string,
  paymentMethod: string
): Promise<boolean> {
  const serviceDate = new Date(request.weekStartDate);
  const paymentDate = new Date();
  
  const html = getPaymentReceiptTemplate(
    user.firstName,
    serviceName,
    serviceDate,
    amount,
    boat.name,
    invoiceNumber,
    paymentMethod,
    paymentDate
  );
  
  return sendEmail({
    to: user.email,
    from: process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
    subject: 'Payment Receipt - Poopalotzi Pump-Out Service',
    html,
  });
}

/**
 * Send weekly schedule to employee
 */
export async function sendEmployeeWeeklyScheduleEmail(
  user: User,
  weekStartDate: Date,
  assignments: {
    requestId: number;
    boatName: string;
    marinaName: string;
    dock: string;
    slip: number;
    serviceDate: Date;
    status: string;
  }[]
): Promise<boolean> {
  const html = getEmployeeWeeklyScheduleTemplate(
    user.firstName,
    weekStartDate,
    assignments
  );
  
  return sendEmail({
    to: user.email,
    from: process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
    subject: `Your Weekly Schedule - ${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    html,
  });
}

/**
 * Test email service
 */
export async function testEmailService(testEmail: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Poopalotzi Email Test</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
        <p style="margin-top: 0;">Hello,</p>
        <p>This is a test email from the Poopalotzi application.</p>
        <p>If you're receiving this, it means the email notification system is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Best regards,<br>The Poopalotzi Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} Poopalotzi. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: testEmail,
    from: process.env.SENDGRID_FROM_EMAIL || 'notifications@poopalotzi.com',
    subject: 'Poopalotzi Email System Test',
    html,
  });
}