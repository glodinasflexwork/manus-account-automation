import axios from 'axios';

export class SMSActivateClient {
  private apiKey: string;
  private baseUrl = 'https://sms-activate.org/stubs/handler_api.php';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SMS_ACTIVATE_API_KEY || '';
  }

  // Get account balance
  async getBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          action: 'getBalance'
        }
      });

      if (response.data.startsWith('ACCESS_BALANCE:')) {
        const balance = parseFloat(response.data.split(':')[1]);
        return { success: true, balance };
      }

      return { success: false, error: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get available services
  async getServices(): Promise<{ success: boolean; services?: Record<string, unknown>[]; error?: string }> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          action: 'getServices'
        }
      });

      if (typeof response.data === 'object') {
        const services = Object.entries(response.data).map(([id, name]) => ({
          id: parseInt(id),
          name: String(name)
        }));
        return { success: true, services };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get phone number for service
  async getNumber(serviceId: string = 'manus'): Promise<{ 
    success: boolean; 
    id?: string; 
    number?: string; 
    error?: string 
  }> {
    try {
      // Try to find Manus service ID or use a generic service
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          action: 'getNumber',
          service: serviceId,
          country: '0' // Any country
        }
      });

      if (response.data.startsWith('ACCESS_NUMBER:')) {
        const parts = response.data.split(':');
        return {
          success: true,
          id: parts[1],
          number: parts[2]
        };
      }

      return { success: false, error: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check for SMS
  async getSMS(id: string): Promise<{ 
    success: boolean; 
    code?: string; 
    status?: string; 
    error?: string 
  }> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          action: 'getStatus',
          id: id
        }
      });

      if (response.data.startsWith('STATUS_OK:')) {
        const code = response.data.split(':')[1];
        return { success: true, code, status: 'received' };
      }

      if (response.data === 'STATUS_WAIT_CODE') {
        return { success: true, status: 'waiting' };
      }

      return { success: false, error: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Set status (confirm SMS received)
  async setStatus(id: string, status: string = '6'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          action: 'setStatus',
          id: id,
          status: status // 6 = SMS received and confirmed
        }
      });

      if (response.data === 'ACCESS_READY') {
        return { success: true };
      }

      return { success: false, error: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

