import axios from 'axios';

export interface GuerrillaEmailData {
  email: string;
  token: string;
  alias?: string;
}

export interface GuerrillaMessage {
  mail_id: string;
  mail_from: string;
  mail_subject: string;
  mail_excerpt: string;
  mail_timestamp: string;
  mail_read: string;
  mail_date: string;
}

export class GuerrillaMailClient {
  private baseUrl = 'https://api.guerrillamail.com/ajax.php';
  private token: string | null = null;
  private email: string | null = null;

  // Get a temporary email address
  async getEmailAddress(): Promise<GuerrillaEmailData> {
    try {
      const response = await axios.get(`${this.baseUrl}?f=get_email_address`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data && response.data.email_addr) {
        this.email = response.data.email_addr;
        this.token = response.data.sid_token;
        
        return {
          email: this.email,
          token: this.token,
          alias: response.data.alias
        };
      } else {
        throw new Error('Failed to get email address from Guerrilla Mail');
      }
    } catch (error) {
      console.error('Error getting Guerrilla Mail email:', error);
      throw new Error('Failed to get temporary email address');
    }
  }

  // Get email list
  async getEmails(): Promise<GuerrillaMessage[]> {
    if (!this.token) {
      throw new Error('No token available. Get email address first.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}?f=get_email_list&sid_token=${this.token}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      return response.data.list || [];
    } catch (error) {
      console.error('Error fetching Guerrilla Mail emails:', error);
      throw new Error('Failed to fetch emails');
    }
  }

  // Get specific email content
  async getEmailContent(emailId: string): Promise<any> {
    if (!this.token) {
      throw new Error('No token available. Get email address first.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}?f=fetch_email&sid_token=${this.token}&email_id=${emailId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Guerrilla Mail email content:', error);
      throw new Error('Failed to fetch email content');
    }
  }

  // Wait for verification email from Manus
  async waitForVerificationEmail(
    emailAddress: string,
    timeoutMs: number = 120000 // 2 minutes
  ): Promise<any> {
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const emails = await this.getEmails();
        
        // Look for emails from Manus
        const verificationEmail = emails.find((email: GuerrillaMessage) => 
          email.mail_from.toLowerCase().includes('manus') ||
          email.mail_subject.toLowerCase().includes('verify') ||
          email.mail_subject.toLowerCase().includes('confirm') ||
          email.mail_excerpt.toLowerCase().includes('verification')
        );

        if (verificationEmail) {
          // Get full email content
          const fullEmail = await this.getEmailContent(verificationEmail.mail_id);
          return fullEmail;
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      } catch (error) {
        console.error('Error checking for verification email:', error);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error('Verification email timeout');
  }

  // Extract verification link from email content
  extractVerificationLink(emailContent: string): string | null {
    // Common patterns for verification links
    const patterns = [
      /https?:\/\/[^\s]+verify[^\s]*/gi,
      /https?:\/\/[^\s]+confirm[^\s]*/gi,
      /https?:\/\/[^\s]+activation[^\s]*/gi,
      /https?:\/\/manus\.im[^\s]*/gi,
    ];

    for (const pattern of patterns) {
      const matches = emailContent.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].replace(/[">)\]]+$/, ''); // Clean trailing characters
      }
    }

    return null;
  }

  // Get current email address
  getCurrentEmail(): string | null {
    return this.email;
  }

  // Get current token
  getCurrentToken(): string | null {
    return this.token;
  }
}

export function getGuerrillaMailClient(): GuerrillaMailClient {
  return new GuerrillaMailClient();
}

