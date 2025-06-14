import axios from 'axios';

// Helper function to get the base URL for API calls
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  
  // Server-side: check for Vercel URL or fallback
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NODE_ENV === 'production') {
    // Production fallback - you should set this in Vercel env vars
    return process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
  }
  
  // Development fallback
  return 'http://localhost:3000';
}

// Enhanced retry configuration for completely free services
interface RetryConfig {
  maxAttempts: number;
  timeoutMinutes: number;
  backoffMultiplier: number;
  services: string[];
}

interface RetryStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  rejectionReasons: string[];
  servicesUsed: string[];
  averageAttemptTime: number;
  lastError?: string;
}

interface AttemptResult {
  success: boolean;
  data?: any;
  error?: string;
  service?: string;
  attemptTime: number;
  rejectionReason?: string;
}

export class RetryAutomationService {
  private config: RetryConfig;
  private stats: RetryStats;
  private baseUrl: string;

  constructor(config: RetryConfig) {
    this.config = config;
    this.baseUrl = getBaseUrl();
    this.stats = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      rejectionReasons: [],
      servicesUsed: [],
      averageAttemptTime: 0
    };
  }

  async runRetryAutomation(onProgress?: (progress: any) => void): Promise<AttemptResult> {
    const startTime = Date.now();
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        const error = `Timeout reached after ${this.config.timeoutMinutes} minutes`;
        this.stats.lastError = error;
        return { success: false, error, attemptTime: Date.now() - startTime };
      }

      onProgress?.({
        currentAttempt: attempt,
        maxAttempts: this.config.maxAttempts,
        status: `Starting attempt ${attempt} with completely free services...`,
        stats: this.stats
      });

      try {
        const result = await this.runSingleAttempt(attempt, onProgress);
        
        if (result.success) {
          this.stats.successfulAttempts++;
          this.stats.averageAttemptTime = (Date.now() - startTime) / attempt;
          return result;
        } else {
          this.stats.failedAttempts++;
          if (result.rejectionReason) {
            this.stats.rejectionReasons.push(result.rejectionReason);
          }
          this.stats.lastError = result.error;
        }

        // Exponential backoff before next attempt
        if (attempt < this.config.maxAttempts) {
          const delay = Math.min(1000 * Math.pow(this.config.backoffMultiplier, attempt - 1), 30000);
          onProgress?.({
            currentAttempt: attempt,
            maxAttempts: this.config.maxAttempts,
            status: `Waiting ${delay/1000}s before trying different free services...`,
            stats: this.stats
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        this.stats.failedAttempts++;
        this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
        
        onProgress?.({
          currentAttempt: attempt,
          maxAttempts: this.config.maxAttempts,
          status: `Attempt ${attempt} failed: ${this.stats.lastError}`,
          stats: this.stats
        });
      }

      this.stats.totalAttempts = attempt;
    }

    return {
      success: false,
      error: `All ${this.config.maxAttempts} attempts failed. Last error: ${this.stats.lastError}`,
      attemptTime: Date.now() - startTime
    };
  }

  private async runSingleAttempt(attemptNumber: number, onProgress?: (progress: any) => void): Promise<AttemptResult> {
    const attemptStartTime = Date.now();

    try {
      // Step 1: Generate Email (using Guerrilla Mail - completely free)
      onProgress?.({
        currentAttempt: attemptNumber,
        step: 1,
        status: 'Generating free email address with Guerrilla Mail...'
      });

      const emailClient = new MailTmClient();
      const emailResult = await emailClient.getEmailAddress();
      if (!emailResult.success) {
        return {
          success: false,
          error: `Email generation failed: ${emailResult.error}`,
          attemptTime: Date.now() - attemptStartTime,
          rejectionReason: 'Email service unavailable'
        };
      }

      const email = emailResult.data.email;
      onProgress?.({
        currentAttempt: attemptNumber,
        step: 1,
        status: `Free email generated: ${email}`
      });

      // Step 2: Get Phone Number (using completely free services only)
      onProgress?.({
        currentAttempt: attemptNumber,
        step: 2,
        status: 'Getting free phone number from web-scraping services...'
      });

      // Use only free SMS services (no API keys required)
      const phoneResult = await this.makeApiCall('/api/free-sms', 'POST', {
        preferredServices: [
          'receive-sms-online.info',
          'sms-online.co', 
          'freesmsverification.com',
          'receive-sms.cc',
          'sms24.me',
          'receivesmsonline.net'
        ]
      });

      if (!phoneResult.success) {
        return {
          success: false,
          error: `Phone number generation failed: ${phoneResult.error}`,
          attemptTime: Date.now() - attemptStartTime,
          rejectionReason: 'All free phone services unavailable'
        };
      }

      const phoneNumber = phoneResult.data.phoneNumber;
      const phoneId = phoneResult.data.id;
      const phoneService = phoneResult.data.service || 'Free SMS Service';
      
      this.stats.servicesUsed.push(phoneService);
      
      onProgress?.({
        currentAttempt: attemptNumber,
        step: 2,
        status: `Free phone number obtained: ${phoneNumber} (${phoneService})`
      });

      // Step 3: Create Manus Account
      onProgress?.({
        currentAttempt: attemptNumber,
        step: 3,
        status: 'Creating Manus account with free credentials...'
      });

      const manusResult = await this.makeApiCall('/api/manus', 'POST', {
        email,
        phoneNumber
      });

      if (!manusResult.success) {
        // Check for specific rejection reasons
        const errorMsg = manusResult.error?.toLowerCase() || '';
        let rejectionReason = 'Unknown rejection';
        
        if (errorMsg.includes('email') && (errorMsg.includes('invalid') || errorMsg.includes('blocked'))) {
          rejectionReason = 'Free email rejected by Manus';
        } else if (errorMsg.includes('phone') && (errorMsg.includes('invalid') || errorMsg.includes('blocked'))) {
          rejectionReason = 'Free phone number rejected by Manus';
        } else if (errorMsg.includes('rate limit')) {
          rejectionReason = 'Rate limited by Manus';
        } else if (errorMsg.includes('blocked') || errorMsg.includes('banned')) {
          rejectionReason = 'IP or free service blocked by Manus';
        } else if (errorMsg.includes('disposable') || errorMsg.includes('temporary')) {
          rejectionReason = 'Manus detected disposable email/phone';
        }

        return {
          success: false,
          error: `Manus account creation failed: ${manusResult.error}`,
          attemptTime: Date.now() - attemptStartTime,
          rejectionReason,
          service: phoneService
        };
      }

      onProgress?.({
        currentAttempt: attemptNumber,
        step: 3,
        status: 'Manus account created successfully with free services!'
      });

      // Step 4: Verify Email
      onProgress?.({
        currentAttempt: attemptNumber,
        step: 4,
        status: 'Checking for verification email...'
      });

      // Wait a bit for email to arrive
      await new Promise(resolve => setTimeout(resolve, 5000));

      const emailVerifyResult = await emailClient.waitForVerificationEmail(email);
      if (!emailVerifyResult.success) {
        return {
          success: false,
          error: `Email verification failed: ${emailVerifyResult.error}`,
          attemptTime: Date.now() - attemptStartTime,
          rejectionReason: 'Email verification failed'
        };
      }

      onProgress?.({
        currentAttempt: attemptNumber,
        step: 4,
        status: 'Email verification completed!'
      });

      // Step 5: Verify Phone
      onProgress?.({
        currentAttempt: attemptNumber,
        step: 5,
        status: 'Checking for SMS verification code...'
      });

      // Wait a bit for SMS to arrive
      await new Promise(resolve => setTimeout(resolve, 10000));

      const phoneVerifyResult = await this.makeApiCall(`/api/free-sms/${phoneId}`, 'GET', {});
      if (!phoneVerifyResult.success) {
        return {
          success: false,
          error: `Phone verification failed: ${phoneVerifyResult.error}`,
          attemptTime: Date.now() - attemptStartTime,
          rejectionReason: 'SMS verification failed'
        };
      }

      onProgress?.({
        currentAttempt: attemptNumber,
        step: 5,
        status: 'Phone verification completed!'
      });

      // Success!
      return {
        success: true,
        data: {
          email,
          phoneNumber,
          service: phoneService,
          manusAccount: manusResult.data,
          cost: '$0.00 (completely free!)'
        },
        attemptTime: Date.now() - attemptStartTime,
        service: phoneService
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        attemptTime: Date.now() - attemptStartTime,
        rejectionReason: 'System error'
      };
    }
  }

  private async makeApiCall(endpoint: string, method: 'GET' | 'POST', data?: any): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      // Construct absolute URL
      const url = `${this.baseUrl}${endpoint}`;
      
      console.log(`Making ${method} request to: ${url}`);
      
      const config = {
        method,
        url,
        timeout: 30000, // 30 second timeout per request
        headers: {
          'Content-Type': 'application/json',
        },
        ...(method === 'POST' && data ? { data } : {})
      };

      const response = await axios(config);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error'
      };
    }
  }

  getStats(): RetryStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      rejectionReasons: [],
      servicesUsed: [],
      averageAttemptTime: 0
    };
  }
}

export default RetryAutomationService;


import { MailTmClient } from './mail-tm';

