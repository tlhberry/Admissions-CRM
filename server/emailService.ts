// Email Service for sending notifications
// Configure SENDGRID_API_KEY and NOTIFICATION_EMAIL to enable email notifications

export interface EmailNotification {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface AdmissionScheduledData {
  clientName: string;
  phoneNumber: string;
  email?: string;
  expectedAdmitDate: string;
  levelOfCare: string;
  insuranceProvider?: string;
  insurancePolicyId?: string;
  schedulingNotes?: string;
}

class EmailService {
  private isConfigured: boolean;
  private notificationEmail: string | undefined;

  constructor() {
    this.isConfigured = !!process.env.SENDGRID_API_KEY;
    this.notificationEmail = process.env.NOTIFICATION_EMAIL;
    
    if (!this.isConfigured) {
      console.log("Email service: SENDGRID_API_KEY not configured. Email notifications will be logged only.");
    }
    if (!this.notificationEmail) {
      console.log("Email service: NOTIFICATION_EMAIL not configured. Set this to receive admission notifications.");
    }
  }

  async sendEmail(notification: EmailNotification): Promise<boolean> {
    // Log the notification regardless of configuration
    console.log("Email notification:", {
      to: notification.to,
      subject: notification.subject,
      preview: notification.text.substring(0, 100) + "...",
    });

    if (!this.isConfigured) {
      console.log("Email service: Would send email but SENDGRID_API_KEY not configured");
      return false;
    }

    try {
      // Dynamic import to avoid errors when SendGrid isn't installed
      const sgMail = await import("@sendgrid/mail").catch(() => null);
      
      if (!sgMail) {
        console.log("Email service: @sendgrid/mail package not installed");
        return false;
      }

      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!);
      
      await sgMail.default.send({
        to: notification.to,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@admissions-crm.app",
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
      });

      console.log(`Email sent successfully to ${notification.to}`);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async sendAdmissionScheduledNotification(data: AdmissionScheduledData): Promise<boolean> {
    if (!this.notificationEmail) {
      console.log("Email service: NOTIFICATION_EMAIL not configured, skipping admission notification");
      return false;
    }

    const subject = `New Admission Scheduled: ${data.clientName}`;
    
    const text = `
New Admission Scheduled

Client Details:
- Name: ${data.clientName}
- Phone: ${data.phoneNumber}
${data.email ? `- Email: ${data.email}` : ""}

Admission Details:
- Expected Date: ${data.expectedAdmitDate}
- Level of Care: ${data.levelOfCare}

Insurance Information:
- Provider: ${data.insuranceProvider || "Not provided"}
- Policy ID: ${data.insurancePolicyId || "Not provided"}

${data.schedulingNotes ? `Notes:\n${data.schedulingNotes}` : ""}

---
This notification was sent automatically by the Admissions CRM.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #6b7280; }
    .value { margin-left: 10px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Admission Scheduled</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.clientName}</p>
    </div>
    <div class="content">
      <div class="section">
        <h3 style="margin-top: 0;">Client Details</h3>
        <p><span class="label">Name:</span><span class="value">${data.clientName}</span></p>
        <p><span class="label">Phone:</span><span class="value">${data.phoneNumber}</span></p>
        ${data.email ? `<p><span class="label">Email:</span><span class="value">${data.email}</span></p>` : ""}
      </div>
      <div class="section">
        <h3>Admission Details</h3>
        <p><span class="label">Expected Date:</span><span class="value">${data.expectedAdmitDate}</span></p>
        <p><span class="label">Level of Care:</span><span class="value">${data.levelOfCare}</span></p>
      </div>
      <div class="section">
        <h3>Insurance Information</h3>
        <p><span class="label">Provider:</span><span class="value">${data.insuranceProvider || "Not provided"}</span></p>
        <p><span class="label">Policy ID:</span><span class="value">${data.insurancePolicyId || "Not provided"}</span></p>
      </div>
      ${data.schedulingNotes ? `
      <div class="section">
        <h3>Notes</h3>
        <p>${data.schedulingNotes}</p>
      </div>
      ` : ""}
      <div class="footer">
        This notification was sent automatically by the Admissions CRM.
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: this.notificationEmail,
      subject,
      text,
      html,
    });
  }
}

export const emailService = new EmailService();
