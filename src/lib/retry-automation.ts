import axios from 'axios';

// Types for retry automation
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeoutMinutes: number;
}

interface ServiceAttempt {
  attempt: number;
  email: string;
  phoneNumber: string | null;
  phoneService: string | null;
  emailService: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  manusResponse?: string;
}

interface RetryResult {
  success: boolean;
  attempts: ServiceAttempt[];
  finalData?: {
    email: string;
    phoneNumber: string | null;
    phoneService: string | null;
    accountData?: Record<string, unknown>;
  };
  error?: string;
  totalTime: number;
}

export class RetryAutomationService {
  private config: RetryConfig;
  private attempts: ServiceAttempt[] = [];
  private startTime: number = 0;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 10, // Try up to 10 different email/phone combinations
      initialDelay: 30000, // Start with 30 seconds delay
      maxDelay: 300000, // Max 5 minutes delay
      backoffMultiplier: 1.5, // Increase delay by 50% each time
      timeoutMinutes: 30, // Total timeout of 30 minutes
      ...config
    };
  }

  // Generate a new email address
  private async generateNewEmail(): Promise<{ email: string; service: string }> {
    try {
      console.log('📧 Generating new email address...');
      const response = await axios.get('/api/guerrilla-mail');
      const data = response.data;
      
      if (data.success) {
        return {
          email: data.email,
          service: 'guerrilla-mail'
        };
      } else {
        throw new Error('Failed to generate email');
      }
    } catch (error) {
      console.error('❌ Email generation failed:', error);
      throw error;
    }
  }

  // Generate a new phone number
  private async generateNewPhone(): Promise<{ phoneNumber: string; service: string; id: string } | null> {
    try {
      console.log('📱 Generating new phone number...');
      
      // Try free SMS services first
      try {
        const response = await axios.get('/api/free-sms');
        const data = response.data;
        
        if (data.success) {
          return {
            phoneNumber: data.phoneNumber,
            service: data.service,
            id: data.id
          };
        }
      } catch (error) {
        console.log('Free SMS services failed, trying SMS-Activate...');
      }

      // Fallback to SMS-Activate
      try {
        const servicesResponse = await axios.get('/api/sms-activate');
        const servicesData = servicesResponse.data;
        
        if (servicesData.success) {
          const createResponse = await axios.post('/api/sms-activate', {
            serviceId: 'manus'
          });
          
          const createData = createResponse.data;
          
          if (createData.success) {
            return {
              phoneNumber: createData.verification.number,
              service: 'sms-activate',
              id: createData.verification.id
            };
          }
        }
      } catch (error) {
        console.log('SMS-Activate also failed:', error);
      }

      return null;
    } catch (error) {
      console.error('❌ Phone generation failed:', error);
      return null;
    }
  }

  // Check if Manus rejected the email/phone combination
  private isManusRejection(error: string, manusResponse?: string): boolean {
    const rejectionPatterns = [
      'email already exists',
      'phone number already used',
      'invalid email address',
      'invalid phone number',
      'email not allowed',
      'phone not allowed',
      'temporary email not allowed',
      'disposable email detected',
      'voip number not allowed',
      'virtual number not allowed',
      'email verification failed',
      'phone verification failed',
      'account creation blocked'
    ];

    const errorLower = error.toLowerCase();
    const responseLower = manusResponse?.toLowerCase() || '';
    
    return rejectionPatterns.some(pattern => 
      errorLower.includes(pattern) || responseLower.includes(pattern)
    );
  }

  // Calculate delay with exponential backoff
  private calculateDelay(attemptNumber: number): number {
    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attemptNumber - 1),
      this.config.maxDelay
    );
    
    // Add some randomness to avoid thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  // Check if we should continue retrying
  private shouldContinueRetrying(): boolean {
    const elapsedTime = Date.now() - this.startTime;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    
    return (
      this.attempts.length < this.config.maxRetries &&
      elapsedTime < timeoutMs
    );
  }

  // Attempt to create Manus account with given credentials
  private async attemptAccountCreation(
    email: string, 
    phoneNumber: string | null
  ): Promise<{ success: boolean; accountData?: Record<string, unknown>; error?: string; manusResponse?: string }> {
    try {
      console.log(`🤖 Attempting Manus account creation with email: ${email}, phone: ${phoneNumber}`);
      
      const response = await axios.post('/api/manus', {
        email: email,
        phone: phoneNumber
      });
      
      const data = response.data;
      
      if (data.success) {
        console.log('✅ Manus account created successfully!');
        return {
          success: true,
          accountData: data.accountData
        };
      } else {
        console.log('❌ Manus account creation failed:', data.error);
        return {
          success: false,
          error: data.error || 'Account creation failed',
          manusResponse: data.manusResponse || data.details
        };
      }
    } catch (error) {
      console.error('❌ Account creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        manusResponse: axios.isAxiosError(error) ? error.response?.data?.message : undefined
      };
    }
  }

  // Main retry automation method
  async runWithRetry(): Promise<RetryResult> {
    console.log('🚀 Starting retry automation with config:', this.config);
    
    this.startTime = Date.now();
    this.attempts = [];

    while (this.shouldContinueRetrying()) {
      const attemptNumber = this.attempts.length + 1;
      console.log(`\n🔄 Attempt ${attemptNumber}/${this.config.maxRetries}`);

      const attempt: ServiceAttempt = {
        attempt: attemptNumber,
        email: '',
        phoneNumber: null,
        phoneService: null,
        emailService: '',
        timestamp: new Date(),
        success: false
      };

      try {
        // Generate new email
        const emailResult = await this.generateNewEmail();
        attempt.email = emailResult.email;
        attempt.emailService = emailResult.service;
        
        console.log(`📧 Generated email: ${attempt.email}`);

        // Generate new phone (optional, but recommended)
        const phoneResult = await this.generateNewPhone();
        if (phoneResult) {
          attempt.phoneNumber = phoneResult.phoneNumber;
          attempt.phoneService = phoneResult.service;
          console.log(`📱 Generated phone: ${attempt.phoneNumber} (via ${attempt.phoneService})`);
        } else {
          console.log('📱 No phone number available, proceeding without phone');
        }

        // Attempt account creation
        const accountResult = await this.attemptAccountCreation(
          attempt.email,
          attempt.phoneNumber
        );

        if (accountResult.success) {
          attempt.success = true;
          this.attempts.push(attempt);
          
          const totalTime = Date.now() - this.startTime;
          console.log(`🎉 SUCCESS! Account created after ${attemptNumber} attempts in ${Math.round(totalTime/1000)}s`);
          
          return {
            success: true,
            attempts: this.attempts,
            finalData: {
              email: attempt.email,
              phoneNumber: attempt.phoneNumber,
              phoneService: attempt.phoneService,
              accountData: accountResult.accountData
            },
            totalTime: totalTime
          };
        } else {
          attempt.success = false;
          attempt.error = accountResult.error;
          attempt.manusResponse = accountResult.manusResponse;
          this.attempts.push(attempt);
          
          console.log(`❌ Attempt ${attemptNumber} failed: ${attempt.error}`);
          
          // Check if this is a Manus rejection that we should retry
          if (this.isManusRejection(attempt.error || '', attempt.manusResponse)) {
            console.log('🔄 Detected Manus rejection, will retry with new credentials...');
            
            if (this.shouldContinueRetrying()) {
              const delay = this.calculateDelay(attemptNumber);
              console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next attempt...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            console.log('❌ Non-retriable error, stopping automation');
            break;
          }
        }
      } catch (error) {
        attempt.success = false;
        attempt.error = error instanceof Error ? error.message : 'Unknown error';
        this.attempts.push(attempt);
        
        console.error(`❌ Attempt ${attemptNumber} crashed:`, error);
        
        if (this.shouldContinueRetrying()) {
          const delay = this.calculateDelay(attemptNumber);
          console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const totalTime = Date.now() - this.startTime;
    console.log(`❌ All attempts failed after ${Math.round(totalTime/1000)}s`);
    
    return {
      success: false,
      attempts: this.attempts,
      error: `Failed after ${this.attempts.length} attempts`,
      totalTime: totalTime
    };
  }

  // Get retry statistics
  getStats(): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageDelayMs: number;
    totalTimeMs: number;
    rejectionReasons: Record<string, number>;
  } {
    const successful = this.attempts.filter(a => a.success).length;
    const failed = this.attempts.filter(a => !a.success).length;
    const totalTime = this.attempts.length > 0 ? 
      this.attempts[this.attempts.length - 1].timestamp.getTime() - this.attempts[0].timestamp.getTime() : 0;
    
    const rejectionReasons: Record<string, number> = {};
    this.attempts.forEach(attempt => {
      if (!attempt.success && attempt.error) {
        const key = attempt.error.substring(0, 50); // First 50 chars
        rejectionReasons[key] = (rejectionReasons[key] || 0) + 1;
      }
    });

    return {
      totalAttempts: this.attempts.length,
      successfulAttempts: successful,
      failedAttempts: failed,
      averageDelayMs: this.attempts.length > 1 ? totalTime / (this.attempts.length - 1) : 0,
      totalTimeMs: totalTime,
      rejectionReasons
    };
  }
}

export default RetryAutomationService;

