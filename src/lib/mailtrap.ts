import axios from 'axios';

// Mailtrap API client
export class MailtrapClient {
  private apiToken: string;
  private baseUrl = 'https://mailtrap.io/api/v1';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  // Get account info
  async getAccountInfo(): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(`${this.baseUrl}/accounts`, {
        headers: {
          'Api-Token': this.apiToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Mailtrap account info:', error);
      throw new Error('Failed to fetch Mailtrap account info');
    }
  }

  // Get inboxes
  async getInboxes(): Promise<Record<string, unknown>[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/inboxes`, {
        headers: {
          'Api-Token': this.apiToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Mailtrap inboxes:', error);
      throw new Error('Failed to fetch Mailtrap inboxes');
    }
  }

  // Get messages from an inbox
  async getMessages(inboxId: number): Promise<Record<string, unknown>[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/inboxes/${inboxId}/messages`, {
        headers: {
          'Api-Token': this.apiToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Mailtrap messages:', error);
      throw new Error('Failed to fetch Mailtrap messages');
    }
  }

  // Get a specific message
  async getMessage(inboxId: number, messageId: number): Promise<Record<string, unknown>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/inboxes/${inboxId}/messages/${messageId}`,
        {
          headers: {
            'Api-Token': this.apiToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Mailtrap message:', error);
      throw new Error('Failed to fetch Mailtrap message');
    }
  }

  // Generate a random email address for testing
  generateTestEmail(inboxId: number): string {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `test-${randomString}@${inboxId}.mailtrap.io`;
  }

  // Wait for and retrieve verification email
  async waitForVerificationEmail(
    inboxId: number,
    emailAddress: string,
    timeoutMs: number = 60000
  ): Promise<Record<string, unknown>> {
    const startTime = Date.now();
    const pollInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const messages = await this.getMessages(inboxId);
        
        // Look for messages sent to our email address
        const verificationMessage = messages.find((message: Record<string, unknown>) =>
          message.to_email === emailAddress &&
          (String(message.subject || '').toLowerCase().includes('verify') ||
           String(message.subject || '').toLowerCase().includes('confirm') ||
           String(message.subject || '').toLowerCase().includes('activation'))
        );

        if (verificationMessage) {
          // Get the full message content
          const fullMessage = await this.getMessage(inboxId, Number(verificationMessage.id));
          return fullMessage;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling for verification email:', error);
      }
    }

    throw new Error('Timeout waiting for verification email');
  }

  // Extract verification link from email content
  extractVerificationLink(emailContent: string): string | null {
    // Common patterns for verification links
    const patterns = [
      /https?:\/\/[^\s]+verify[^\s]*/gi,
      /https?:\/\/[^\s]+confirm[^\s]*/gi,
      /https?:\/\/[^\s]+activate[^\s]*/gi,
      /https?:\/\/manus\.im[^\s]+/gi,
    ];

    for (const pattern of patterns) {
      const matches = emailContent.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }

    return null;
  }
}

// Create a singleton instance
let mailtrapClient: MailtrapClient | null = null;

export function getMailtrapClient(): MailtrapClient {
  if (!mailtrapClient) {
    const apiToken = process.env.MAILTRAP_API_TOKEN;
    
    if (!apiToken) {
      throw new Error('Mailtrap API token not configured');
    }
    
    mailtrapClient = new MailtrapClient(apiToken);
  }
  
  return mailtrapClient;
}

