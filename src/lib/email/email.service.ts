import { Resend } from "resend";

// ==============================================
// Email Service Interface
// ==============================================

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailService {
  send(payload: EmailPayload): Promise<boolean>;
}

// ==============================================
// Resend Provider
// ==============================================

class ResendEmailService implements EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "RESEND_API_KEY not set — emails will be logged but not sent",
      );
    }
    this.resend = new Resend(apiKey || "placeholder");
    this.fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@mediflow.local";
  }

  async send(payload: EmailPayload): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.log(
          `[EMAIL LOG] To: ${payload.to} | Subject: ${payload.subject}`,
        );
        return true;
      }

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      if (error) {
        console.error("Resend error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Email send failed:", error);
      return false;
    }
  }
}

// ==============================================
// Factory
// ==============================================

let _emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!_emailService) {
    _emailService = new ResendEmailService();
  }
  return _emailService;
}
