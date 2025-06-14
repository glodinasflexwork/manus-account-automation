import axios from 'axios';

export class GuerrillaMailClient {
  private baseUrl = 'https://api.guerrillamail.com/ajax.php';
  private sidToken: string | null = null;
  private emailAddress: string | null = null;

  // Get a temporary email address
  async getEmailAddress(): Promise<{ email: string; sidToken: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}?f=get_email_address`, { timeout: 60000 });
      const data = response.data as Record<string, unknown>;
      
      this.sidToken = String(data.sid_token || '');
      this.emailAddress = String(data.email_addr || '');
      
      if (!this.emailAddress) {
        throw new Error('Failed to get email address from Guerrilla Mail');
      }

      return {
        email: this.emailAddress,
        sidToken: this.sidToken,
      };
    } catch (error) {
      console.error('Error getting Guerrilla Mail email:', error);
      throw new Error('Failed to generate temporary email address');
    }
  }

  // Get email list
  async getEmailList(sidToken?: string): Promise<Record<string, unknown>[]> {
    const token = sidToken || this.sidToken;
    if (!token) {
      throw new Error('No session token available');
    }

    try {
      const response = await axios.get(`${this.baseUrl}?f=get_email_list&sid_token=${token}`);
      const data = response.data as Record<string, unknown>;
      return Array.isArray(data.list) ? data.list as Record<string, unknown>[] : [];
    } catch (error) {
      console.error('Error getting email list:', error);
      return [];
    }
  }

  // Get specific email content
  async getEmail(emailId: string, sidToken?: string): Promise<Record<string, unknown> | null> {
    const token = sidToken || this.sidToken;
    if (!token) {
      throw new Error('No session token available');
    }

    try {
      const response = await axios.get(`${this.baseUrl}?f=fetch_email&sid_token=${token}&email_id=${emailId}`);
      return response.data as Record<string, unknown>;
    } catch (error) {
      console.error('Error getting email content:', error);
      return null;
    }
  }

  // Wait for verification email and extract link
  async waitForVerificationEmail(
    email: string,
    timeoutMs: number = 60000
  ): Promise<Record<string, unknown>> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const emails = await this.getEmailList();
        
        // Look for verification emails
        const verificationEmail = emails.find((emailItem: Record<string, unknown>) => {
          const subject = String(emailItem.mail_subject || '').toLowerCase();
          const from = String(emailItem.mail_from || '').toLowerCase();
          return (
            subject.includes('verify') || 
            subject.includes('confirmation') || 
            subject.includes('activate') ||
            from.includes('manus')
          );
        });

        if (verificationEmail) {
          // Get full email content
          const fullEmail = await this.getEmail(String(verificationEmail.mail_id || ''));
          if (fullEmail) {
            // Extract verification link
            const verificationLink = this.extractVerificationLink(
              String(fullEmail.mail_body || '')
            );
            
            return {
              email: fullEmail,
              verificationLink,
              success: !!verificationLink,
            };
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling for emails:', error);
      }
    }

    throw new Error('Verification email not received within timeout period');
  }

  // Extract verification link from email content
  extractVerificationLink(emailContent: string): string | null {
    // Common verification link patterns
    const patterns = [
      /https?:\/\/[^\s]+verify[^\s]*/gi,
      /https?:\/\/[^\s]+confirm[^\s]*/gi,
      /https?:\/\/[^\s]+activate[^\s]*/gi,
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
}

