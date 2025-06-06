import axios from 'axios';

// TextVerified API client
export class TextVerifiedClient {
  private apiKey: string;
  private username: string;
  private bearerToken: string | null = null;
  private baseUrl = 'https://www.textverified.com/api';

  constructor(apiKey: string, username: string) {
    this.apiKey = apiKey;
    this.username = username;
  }

  // Authenticate and get bearer token
  async authenticate(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pub/v2/auth`,
        {},
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'X-API-USERNAME': this.username,
          },
        }
      );

      this.bearerToken = response.data.token;
      if (!this.bearerToken) {
        throw new Error('No token received from TextVerified');
      }
      return this.bearerToken;
    } catch (error) {
      console.error('TextVerified authentication error:', error);
      throw new Error('Failed to authenticate with TextVerified');
    }
  }

  // Get available verification services
  async getServices(): Promise<Record<string, unknown>[]> {
    if (!this.bearerToken) {
      await this.authenticate();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/pub/v2/services`, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching TextVerified services:', error);
      throw new Error('Failed to fetch TextVerified services');
    }
  }

  // Create a verification (get a phone number)
  async createVerification(serviceId: number): Promise<Record<string, unknown>> {
    if (!this.bearerToken) {
      await this.authenticate();
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/pub/v2/verification`,
        { id: serviceId },
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }
      );

      // Follow the location header to get the verification details
      const verificationUrl = response.headers.location;
      const verificationResponse = await axios.get(verificationUrl, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      });

      return verificationResponse.data;
    } catch (error) {
      console.error('Error creating TextVerified verification:', error);
      throw new Error('Failed to create TextVerified verification');
    }
  }

  // Check for SMS code
  async checkVerification(id: string): Promise<Record<string, unknown>> {
    if (!this.bearerToken) {
      await this.authenticate();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/pub/v2/verification/${id}`, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error checking TextVerified verification:', error);
      throw new Error('Failed to check TextVerified verification');
    }
  }
}

// Create a singleton instance
let textVerifiedClient: TextVerifiedClient | null = null;

export function getTextVerifiedClient(): TextVerifiedClient {
  if (!textVerifiedClient) {
    const apiKey = process.env.TEXTVERIFIED_API_KEY;
    const username = process.env.TEXTVERIFIED_USERNAME;
    
    if (!apiKey || !username) {
      throw new Error('TextVerified API key or username not configured');
    }
    
    textVerifiedClient = new TextVerifiedClient(apiKey, username);
  }
  
  return textVerifiedClient;
}

