// Email templates for various notifications in the Poopalotzi application
// These templates use HTML for rich email formatting

/**
 * Welcome email sent when a user first creates an account
 */
export function getWelcomeEmailTemplate(firstName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to Poopalotzi</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
        <p style="margin-top: 0;">Hello ${firstName},</p>
        <p>Welcome to Poopalotzi, your premium boat pump-out service provider!</p>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
          <li>Add your boat information</li>
          <li>Subscribe to a service plan</li>
          <li>Schedule pump-out services</li>
          <li>Track service history</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://poopalotzi.com'}/member/dashboard" 
             style="background-color: #0B1F3A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Go to Your Dashboard
          </a>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Poopalotzi Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} Poopalotzi. All rights reserved.</p>
        <p>123 Marina Way, Seaside, CA 94955</p>
      </div>
    </div>
  `;
}

/**
 * Email template for subscription confirmation
 */
export function getSubscriptionConfirmationTemplate(
  firstName: string, 
  planName: string, 
  startDate: Date, 
  endDate: Date | null,
  price: number
): string {
  const formattedStartDate = startDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formattedEndDate = endDate ? endDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';

  const formattedPrice = (price / 100).toFixed(2); // Converting cents to dollars

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Subscription Confirmed</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
        <p style="margin-top: 0;">Hello ${firstName},</p>
        <p>Thank you for subscribing to Poopalotzi services! Your subscription has been confirmed.</p>
        
        <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0B1F3A;">Subscription Details</h3>
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Start Date:</strong> ${formattedStartDate}</p>
          <p><strong>End Date:</strong> ${formattedEndDate}</p>
          <p><strong>Amount:</strong> $${formattedPrice}</p>
        </div>
        
        <p>You can now start scheduling pump-out services according to your plan's allowance.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://poopalotzi.com'}/member/request-service" 
             style="background-color: #0B1F3A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Schedule a Service
          </a>
        </div>
        
        <p>Thank you for choosing Poopalotzi for your boat maintenance needs.</p>
        <p>Best regards,<br>The Poopalotzi Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} Poopalotzi. All rights reserved.</p>
        <p>123 Marina Way, Seaside, CA 94955</p>
      </div>
    </div>
  `;
}

/**
 * Email template for subscription renewal reminder
 */
export function getSubscriptionRenewalReminderTemplate(
  firstName: string,
  planName: string,
  expiryDate: Date,
  renewalLink: string
): string {
  const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Subscription Renewal Reminder</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
        <p style="margin-top: 0;">Hello ${firstName},</p>
        <p>This is a friendly reminder that your Poopalotzi ${planName} subscription is set to expire soon.</p>
        
        <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #0B1F3A;">Subscription Expiry</h3>
          <p style="font-size: 16px;"><strong>Expiry Date:</strong> ${formattedExpiryDate}</p>
          <p style="font-size: 18px; color: #e74c3c;"><strong>${daysRemaining} days remaining</strong></p>
        </div>
        
        <p>To ensure uninterrupted service for your boat, please renew your subscription before the expiry date.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${renewalLink}" 
             style="background-color: #0B1F3A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Renew My Subscription
          </a>
        </div>
        
        <p>If you have any questions about your subscription or need assistance, please contact our customer service team.</p>
        <p>Thank you for being a valued Poopalotzi customer.</p>
        <p>Best regards,<br>The Poopalotzi Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} Poopalotzi. All rights reserved.</p>
        <p>123 Marina Way, Seaside, CA 94955</p>
      </div>
    </div>
  `;
}

/**
 * Email template for payment receipt
 */
export function getPaymentReceiptTemplate(
  firstName: string,
  serviceName: string,
  serviceDate: Date,
  amount: number,
  boatName: string,
  invoiceNumber: string,
  paymentMethod: string,
  paymentDate: Date
): string {
  const formattedServiceDate = serviceDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formattedPaymentDate = paymentDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const formattedAmount = (amount / 100).toFixed(2); // Converting cents to dollars

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Payment Receipt</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
        <p style="margin-top: 0;">Hello ${firstName},</p>
        <p>Thank you for your payment. This email serves as your receipt for the pump-out service.</p>
        
        <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0B1F3A;">Receipt Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
              <td style="padding: 8px 0;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Service:</strong></td>
              <td style="padding: 8px 0;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Boat:</strong></td>
              <td style="padding: 8px 0;">${boatName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Service Date:</strong></td>
              <td style="padding: 8px 0;">${formattedServiceDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0;">${paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
              <td style="padding: 8px 0;">${formattedPaymentDate}</td>
            </tr>
            <tr style="border-top: 1px solid #eee;">
              <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
              <td style="padding: 8px 0; font-size: 16px; font-weight: bold;">$${formattedAmount}</td>
            </tr>
          </table>
        </div>
        
        <p>You can view your service history and request additional services by visiting your dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://poopalotzi.com'}/member/service-history" 
             style="background-color: #0B1F3A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Service History
          </a>
        </div>
        
        <p>Thank you for choosing Poopalotzi for your boat maintenance needs.</p>
        <p>Best regards,<br>The Poopalotzi Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} Poopalotzi. All rights reserved.</p>
        <p>123 Marina Way, Seaside, CA 94955</p>
        <p>This receipt was generated automatically. Please keep it for your records.</p>
      </div>
    </div>
  `;
}

/**
 * Weekly schedule email for employees
 */
export function getEmployeeWeeklyScheduleTemplate(
  firstName: string,
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
): string {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  
  const formattedWeekStart = weekStartDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formattedWeekEnd = weekEndDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  
  // Sort assignments by date
  const sortedAssignments = [...assignments].sort((a, b) => 
    a.serviceDate.getTime() - b.serviceDate.getTime()
  );
  
  // Group assignments by day
  const assignmentsByDay: Record<string, typeof assignments> = {};
  
  sortedAssignments.forEach(assignment => {
    const dateKey = assignment.serviceDate.toISOString().split('T')[0];
    if (!assignmentsByDay[dateKey]) {
      assignmentsByDay[dateKey] = [];
    }
    assignmentsByDay[dateKey].push(assignment);
  });
  
  // Generate HTML for assignments grouped by day
  let assignmentsHtml = '';
  
  Object.keys(assignmentsByDay).sort().forEach(dateKey => {
    const date = new Date(dateKey);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric'
    });
    
    assignmentsHtml += `
      <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 10px; color: #0B1F3A; border-bottom: 1px solid #eee; padding-bottom: 5px;">
          ${dayName}, ${formattedDate}
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Boat</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Marina</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Location</th>
              <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    assignmentsByDay[dateKey].forEach(assignment => {
      const statusColor = 
        assignment.status === 'Scheduled' ? '#f39c12' :
        assignment.status === 'Completed' ? '#27ae60' :
        assignment.status === 'Canceled' ? '#e74c3c' : 
        assignment.status === 'Waitlisted' ? '#e67e22' : '#3498db';
      
      assignmentsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${assignment.boatName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${assignment.marinaName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Dock ${assignment.dock}, Slip ${assignment.slip}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
            <span style="display: inline-block; padding: 4px 8px; background-color: ${statusColor}; color: white; border-radius: 4px; font-size: 12px;">
              ${assignment.status}
            </span>
          </td>
        </tr>
      `;
    });
    
    assignmentsHtml += `
          </tbody>
        </table>
      </div>
    `;
  });
  
  // If no assignments
  if (Object.keys(assignmentsByDay).length === 0) {
    assignmentsHtml = `
      <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #666;">No assignments scheduled for this week.</p>
      </div>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B1F3A; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Your Weekly Schedule</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eaeaea; border-top: none;">
        <p style="margin-top: 0;">Hello ${firstName},</p>
        <p>Here is your pump-out service schedule for the week of ${formattedWeekStart} - ${formattedWeekEnd}.</p>
        
        ${assignmentsHtml}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://poopalotzi.com'}/employee/schedule" 
             style="background-color: #0B1F3A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Full Schedule
          </a>
        </div>
        
        <p>If you have any questions about your assignments, please contact your supervisor.</p>
        <p>Best regards,<br>The Poopalotzi Management Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} Poopalotzi. All rights reserved.</p>
        <p>123 Marina Way, Seaside, CA 94955</p>
      </div>
    </div>
  `;
}