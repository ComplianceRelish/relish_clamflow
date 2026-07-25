// src/services/whatsapp-service.ts
// WhatsApp Welcome Message Service using Twilio

interface UserCredentials {
  username: string;
  password: string;
  full_name: string;
  role: string;
  phone_number: string;
}

interface WhatsAppMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageSid?: string;
}

/**
 * WhatsApp Notification Service
 * Sends welcome messages with login credentials to new users
 */
class WhatsAppService {
  private readonly enabled: boolean;

  constructor() {
    this.enabled = process.env.NEXT_PUBLIC_TWILIO_ENABLED === 'true';
  }

  /**
   * Send welcome message with login credentials
   */
  async sendWelcomeMessage(userCredentials: UserCredentials): Promise<WhatsAppMessageResponse> {
    if (!this.enabled) {
      console.log('WhatsApp notifications are disabled');
      return { success: false, error: 'WhatsApp service is disabled' };
    }

    const { username, password, full_name, role, phone_number } = userCredentials;
    const formattedPhone = this.formatPhoneNumber(phone_number);
    const message = this.generateWelcomeMessage(full_name, username, password, role);

    const result = await this.sendMessage(formattedPhone, message);
    if (result.success) {
      console.log('✅ WhatsApp welcome message sent successfully:', result.message);
    } else {
      console.error('❌ Failed to send WhatsApp message:', result.error);
    }
    return result;
  }

  /**
   * Generate welcome message template
   */
  private generateWelcomeMessage(
    fullName: string, 
    username: string, 
    password: string, 
    role: string
  ): string {
    return `🐚 *Welcome to ClamFlow!*

Hello ${fullName},

Your account has been successfully created. Here are your login credentials:

👤 *Username:* ${username}
🔑 *Password:* ${password}
👔 *Role:* ${role}

🌐 *Login URL:* https://clamflowcloud.vercel.app/login

⚠️ *IMPORTANT SECURITY NOTICE:*
- Please change your password immediately after your first login
- Never share your credentials with anyone
- Keep your login information secure

For assistance, contact your system administrator.

Best regards,
ClamFlow Team
Quality • Productivity • Assured`;
  }

  /**
   * Format phone number for WhatsApp (ensure it has country code)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If number doesn't start with country code, assume India (+91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Ensure + prefix for WhatsApp
    return '+' + cleaned;
  }

  /**
   * Send password reset notification
   */
  async sendPasswordResetNotification(
    fullName: string,
    username: string,
    newPassword: string,
    phoneNumber: string
  ): Promise<WhatsAppMessageResponse> {
    if (!this.enabled) {
      return { success: false, error: 'WhatsApp service is disabled' };
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const message = `🔐 *ClamFlow Password Reset*

Hello ${fullName},

Your password has been reset successfully.

👤 *Username:* ${username}
🔑 *New Password:* ${newPassword}

🌐 *Login URL:* https://clamflowcloud.vercel.app/login

⚠️ Please change this password immediately after logging in.

Best regards,
ClamFlow Team`;

    return this.sendMessage(formattedPhone, message);
  }

  async sendNCRAlert(params: {
    recipientPhone: string;
    recipientName: string;
    ncrNumber: string;
    alertType: 'NEW_NCR' | 'OVERDUE' | 'BREACH';
    hoursRemaining?: number;
    recordType: string;
  }): Promise<WhatsAppMessageResponse> {
    if (!this.enabled) return { success: false, message: 'WhatsApp disabled' };
    const messages: Record<string, string> = {
      NEW_NCR: `ClamFlow — RHHF\n\nNew EIA Comment — ${params.ncrNumber}\nRecord: ${params.recordType}\nPlease classify within 24 hours.\nLogin: https://clamflowcloud.vercel.app`,
      OVERDUE: `ClamFlow — RHHF\n\n⚠ OVERDUE NCR: ${params.ncrNumber}\nQC Lead has NOT classified within 24 hours.\nImmediate action required.\nLogin: https://clamflowcloud.vercel.app`,
      BREACH:  `ClamFlow — RHHF\n\n🚨 BREACH NCR: ${params.ncrNumber}\nCorrective action was NOT dispatched within 48 hours.\nEscalated to Admin.\nLogin: https://clamflowcloud.vercel.app`,
    };
    return this.sendMessage(
      this.formatPhoneNumber(params.recipientPhone),
      messages[params.alertType]
    );
  }

  private async sendMessage(to: string, body: string): Promise<WhatsAppMessageResponse> {
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, messageBody: body }),
      });
      const data = await response.json();
      return { success: data.success, message: data.messageSid || data.message, error: data.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();

// Named exports for specific functions
export const sendWelcomeMessage = (credentials: UserCredentials) => 
  whatsappService.sendWelcomeMessage(credentials);

export const sendPasswordResetNotification = (
  fullName: string,
  username: string,
  newPassword: string,
  phoneNumber: string
) => whatsappService.sendPasswordResetNotification(fullName, username, newPassword, phoneNumber);
