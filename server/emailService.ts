// Email Service for sending notifications
// Configure SENDGRID_API_KEY and NOTIFICATION_EMAIL to enable email notifications

export interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
  disposition?: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface AdmissionScheduledData {
  clientName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  expectedAdmitDate: string;
  levelOfCare: string;
  insuranceProvider?: string;
  insurancePolicyId?: string;
  schedulingNotes?: string;
}

class EmailService {
  protected isConfigured: boolean;
  protected notificationEmail: string | undefined;

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
      
      const mailOptions: any = {
        to: notification.to,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@admissions-crm.app",
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
      };
      
      if (notification.attachments && notification.attachments.length > 0) {
        mailOptions.attachments = notification.attachments;
      }
      
      await sgMail.default.send(mailOptions);

      console.log(`Email sent successfully to ${notification.to}`);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async sendAdmissionScheduledNotification(data: AdmissionScheduledData, additionalEmails?: string[]): Promise<boolean> {
    // Collect all email recipients
    const recipients: string[] = [];
    
    // Add emails from notification settings (passed in)
    if (additionalEmails && additionalEmails.length > 0) {
      recipients.push(...additionalEmails);
    }
    
    // Add fallback NOTIFICATION_EMAIL if no other recipients
    if (recipients.length === 0 && this.notificationEmail) {
      recipients.push(this.notificationEmail);
    }
    
    if (recipients.length === 0) {
      console.log("Email service: No email recipients configured for scheduled notifications");
      return false;
    }

    const subject = `New Admit Coming: ${data.clientName} - ${data.expectedAdmitDate}`;
    
    const text = `
We have a new admit! (expected to admit on ${data.expectedAdmitDate})

Client Name: ${data.clientName}

DOB: ${data.dateOfBirth || "Not provided"}

Insurance Name: ${data.insuranceProvider || "Not provided"}

Insurance Policy ID: ${data.insurancePolicyId || "Not provided"}

Admit Date: ${data.expectedAdmitDate}

Admit LOC: ${data.levelOfCare}

${data.schedulingNotes ? `Notes: ${data.schedulingNotes}` : ""}

---
This notification was sent from AdmitSimple CRM.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #16a34a; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; }
    .info-row { margin-bottom: 16px; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #111827; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">We have a new admit!</h1>
      <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.95;">(expected to admit on ${data.expectedAdmitDate})</p>
    </div>
    <div class="content">
      <div class="info-row">
        <span class="label">Client Name:</span> <span class="value">${data.clientName}</span>
      </div>
      <div class="info-row">
        <span class="label">DOB:</span> <span class="value">${data.dateOfBirth || "Not provided"}</span>
      </div>
      <div class="info-row">
        <span class="label">Insurance Name:</span> <span class="value">${data.insuranceProvider || "Not provided"}</span>
      </div>
      <div class="info-row">
        <span class="label">Insurance Policy ID:</span> <span class="value">${data.insurancePolicyId || "Not provided"}</span>
      </div>
      <div class="info-row">
        <span class="label">Admit Date:</span> <span class="value">${data.expectedAdmitDate}</span>
      </div>
      <div class="info-row">
        <span class="label">Admit LOC:</span> <span class="value">${data.levelOfCare}</span>
      </div>
      ${data.schedulingNotes ? `
      <div class="info-row" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <span class="label">Notes:</span><br/>
        <span class="value">${data.schedulingNotes}</span>
      </div>
      ` : ""}
      <div class="footer">
        This notification was sent from AdmitSimple CRM.
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send to all recipients
    console.log(`Sending admission scheduled notification to ${recipients.length} recipient(s): ${recipients.join(", ")}`);
    
    const results = await Promise.all(
      recipients.map(email => 
        this.sendEmail({
          to: email,
          subject,
          text,
          html,
        })
      )
    );
    
    return results.some(r => r); // Return true if at least one email was sent
  }
}

export interface ClientArrivalData {
  clientName: string;
  dateOfBirth?: string;
  expectedAdmitDate: string;
  actualAdmitDate?: string;
  levelOfCare: string;
  insuranceProvider?: string;
  insurancePolicyId?: string;
  schedulingNotes?: string;
}

export interface PreAssessmentFormData {
  preCert?: any;
  nursing?: any;
  preScreening?: any;
}

class EmailServiceExtended extends EmailService {
  async sendClientArrivalNotification(
    data: ClientArrivalData,
    forms: PreAssessmentFormData,
    additionalEmails?: string[]
  ): Promise<boolean> {
    const recipients: string[] = [];
    
    if (additionalEmails && additionalEmails.length > 0) {
      recipients.push(...additionalEmails);
    }
    
    if (recipients.length === 0 && this.notificationEmail) {
      recipients.push(this.notificationEmail);
    }
    
    if (recipients.length === 0) {
      console.log("Email service: No email recipients configured for client arrival notifications");
      return false;
    }

    const subject = `Client Arrived: ${data.clientName}`;
    
    const text = `
Client Has Arrived!

Client Name: ${data.clientName}

DOB: ${data.dateOfBirth || "Not provided"}

Insurance Name: ${data.insuranceProvider || "Not provided"}

Insurance Policy ID: ${data.insurancePolicyId || "Not provided"}

Expected Admit Date: ${data.expectedAdmitDate}

Actual Admit Date: ${data.actualAdmitDate || data.expectedAdmitDate}

Level of Care: ${data.levelOfCare}

${data.schedulingNotes ? `Special Needs/Requirements: ${data.schedulingNotes}` : ""}

---
Pre-assessment forms are attached to this email.
This notification was sent from AdmitSimple CRM.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #16a34a; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; }
    .info-row { margin-bottom: 16px; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #111827; }
    .special-needs { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 16px; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">Client Has Arrived!</h1>
    </div>
    <div class="content">
      <div class="info-row">
        <span class="label">Client Name:</span> <span class="value">${data.clientName}</span>
      </div>
      <div class="info-row">
        <span class="label">DOB:</span> <span class="value">${data.dateOfBirth || "Not provided"}</span>
      </div>
      <div class="info-row">
        <span class="label">Insurance Name:</span> <span class="value">${data.insuranceProvider || "Not provided"}</span>
      </div>
      <div class="info-row">
        <span class="label">Insurance Policy ID:</span> <span class="value">${data.insurancePolicyId || "Not provided"}</span>
      </div>
      <div class="info-row">
        <span class="label">Expected Admit Date:</span> <span class="value">${data.expectedAdmitDate}</span>
      </div>
      <div class="info-row">
        <span class="label">Actual Admit Date:</span> <span class="value">${data.actualAdmitDate || data.expectedAdmitDate}</span>
      </div>
      <div class="info-row">
        <span class="label">Level of Care:</span> <span class="value">${data.levelOfCare}</span>
      </div>
      ${data.schedulingNotes ? `
      <div class="special-needs">
        <span class="label">Special Needs/Requirements:</span><br/>
        <span class="value">${data.schedulingNotes}</span>
      </div>
      ` : ""}
      <div class="footer">
        Pre-assessment forms are attached to this email.<br/>
        This notification was sent from AdmitSimple CRM.
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Create attachments from pre-assessment forms
    const attachments: EmailAttachment[] = [];
    
    if (forms.preCert) {
      attachments.push({
        content: Buffer.from(JSON.stringify(forms.preCert, null, 2)).toString('base64'),
        filename: 'pre-cert-form.json',
        type: 'application/json',
        disposition: 'attachment',
      });
    }
    
    if (forms.nursing) {
      attachments.push({
        content: Buffer.from(JSON.stringify(forms.nursing, null, 2)).toString('base64'),
        filename: 'nursing-assessment-form.json',
        type: 'application/json',
        disposition: 'attachment',
      });
    }
    
    if (forms.preScreening) {
      attachments.push({
        content: Buffer.from(JSON.stringify(forms.preScreening, null, 2)).toString('base64'),
        filename: 'pre-screening-form.json',
        type: 'application/json',
        disposition: 'attachment',
      });
    }

    console.log(`Sending client arrival notification to ${recipients.length} recipient(s): ${recipients.join(", ")}`);
    
    const results = await Promise.all(
      recipients.map(email => 
        this.sendEmail({
          to: email,
          subject,
          text,
          html,
          attachments: attachments.length > 0 ? attachments : undefined,
        })
      )
    );
    
    return results.some(r => r);
  }
}

export const emailService = new EmailServiceExtended();
