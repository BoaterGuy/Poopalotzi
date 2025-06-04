import { sendServiceStatusEmail } from './sendgrid';

// This file contains functions to test email sending functionality

export async function testEmailNotification() {
  console.log('Testing email notification functionality...');
  
  // Test with SendGrid API key
  if (process.env.SENDGRID_API_KEY) {
    console.log('SENDGRID_API_KEY found. Will attempt to send a real email.');
  } else {
    console.log('SENDGRID_API_KEY not found. Will simulate email sending.');
  }
  
  // Test email to admin (replace with actual email for real testing)
  const testEmail = 'admin@poopalotzi.com';
  const result = await sendServiceStatusEmail(
    testEmail,
    'Admin',
    'Email System Test',
    'This is a test of the Poopalotzi email notification system.'
  );
  
  if (result) {
    console.log('Email test completed successfully!');
  } else {
    console.error('Email test failed. Check logs for details.');
  }
  
  return result;
}

// Additional email notification types we could implement:
// 1. Welcome emails for new users
// 2. Subscription purchase confirmations
// 3. Subscription renewal reminders
// 4. Weekly schedule summaries for employees
// 5. Payment receipts
// 6. Password reset emails