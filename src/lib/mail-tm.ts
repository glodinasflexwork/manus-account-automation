import axios from 'axios';

export class MailTmClient {
  private baseUrl = 'https://api.mail.tm';
  private token: string | null = null;
  private emailAddress: string | null = null;
  private accountId: string | null = null;

  async getEmailAddress(): Promise<{ email: string; token: string }> {
    try {
      // Create a new account
      const createAccountResponse = await axios.post(`${this.baseUrl}/accounts`, {
        address: `test${Date.now()}@mail.tm`,
        password: 'password123' // A dummy password for temporary account
      });
      this.emailAddress = createAccountResponse.data.address;
      this.accountId = createAccountResponse.data.id;

      // Get a token for the new account
      const loginResponse = await axios.post(`${this.baseUrl}/token`, {
        address: this.emailAddress,
        password: 'password123'
      });
      this.token = loginResponse.data.token;

      if (!this.emailAddress || !this.token) {
        throw new Error('Failed to get email address or token from Mail.tm');
      }

      return {
        email: this.emailAddress,
        token: this.token,
      };
    } catch (error) {
      console.error('Error getting Mail.tm email:', error);
      throw new Error('Failed to generate temporary email address from Mail.tm');
    }
  }

  async getEmails(): Promise<any[]> {
    if (!this.token || !this.accountId) {
      throw new Error('No token or account ID available');
    }
    try {
      const response = await axios.get(`${this.baseUrl}/messages`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting email list from Mail.tm:', error);
      return [];
    }
  }

  async getEmailContent(messageId: string): Promise<any | null> {
    if (!this.token || !this.accountId) {
      throw new Error('No token or account ID available');
    }
    try {
      const response = await axios.get(`${this.baseUrl}/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting email content from Mail.tm:', error);
      return null;
    }
  }

  async waitForVerificationEmail(
    email: string,
    timeoutMs: number = 120000 // Increased timeout for Mail.tm
  ): Promise<Record<string, unknown>> {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const emails = await this.getEmails();
        
        const verificationEmail = emails.find((emailItem: any) => {
          const subject = String(emailItem.subject || '').toLowerCase();
          const from = String(emailItem.from.address || '').toLowerCase();
          return (
            subject.includes('verify') || 
            subject.includes('confirmation') || 
            subject.includes('activate') ||
            from.includes('manus')
          );
        });

        if (verificationEmail) {
          const fullEmail = await this.getEmailContent(verificationEmail.id);
          if (fullEmail) {
            const verificationLink = this.extractVerificationLink(
              String(fullEmail.html || fullEmail.text || '')
            );
            
            return {
              email: fullEmail,
              verificationLink,
              success: !!verificationLink,
            };
          }
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling for emails from Mail.tm:', error);
      }
    }

    throw new Error('Verification email not received within timeout period from Mail.tm');
  }

  extractVerificationLink(emailContent: string): string | null {
    const patterns = [
      /https?:\/\/[^\s]+verify[^\s]*/gi,
      /https?:\/\/[^\s]+confirm[^\s]*/gi,
      /https?:\/\/[^\s]+activate[^\s]*/gi,
      /https?:\/\/manus\.im[^\s]*/gi,
    ];

    for (const pattern of patterns) {
      const matches = emailContent.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].replace(/[">)\]]+$/, '');
      }
    }

    return null;
  }
}


