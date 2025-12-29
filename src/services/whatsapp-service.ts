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
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly whatsappNumber: string;
  private readonly enabled: boolean;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
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

    if (!this.accountSid || !this.authToken) {
      console.error('Twilio credentials are missing');
      return { success: false, error: 'Twilio credentials not configured' };
    }

    const { username, password, full_name, role, phone_number } = userCredentials;

    // Format phone number for WhatsApp (must include country code)
    const formattedPhone = this.formatPhoneNumber(phone_number);

    const message = this.generateWelcomeMessage(full_name, username, password, role);

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.whatsappNumber,
            To: `whatsapp:${formattedPhone}`,
            Body: message,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ WhatsApp welcome message sent successfully:', data.sid);
        return { 
          success: true, 
          message: 'Welcome message sent successfully',
          messageSid: data.sid 
        };
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to send WhatsApp message:', errorData);
        return { 
          success: false, 
          error: errorData.message || 'Failed to send WhatsApp message' 
        };
      }
    } catch (error) {
      console.error('❌ WhatsApp service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
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

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.whatsappNumber,
            To: `whatsapp:${formattedPhone}`,
            Body: message,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: 'Password reset notification sent',
          messageSid: data.sid 
        };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
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
