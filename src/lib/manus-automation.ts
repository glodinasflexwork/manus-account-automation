import puppeteer, { Browser, Page } from 'puppeteer';

export interface ManusAccountData {
  fullName: string;
  email: string;
  password: string;
}

export interface AutomationResult {
  success: boolean;
  message: string;
  accountData?: ManusAccountData;
  error?: string;
}

export class ManusAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private invitationCode: string;

  constructor(invitationCode: string = 'QVDRZAYJMTKC') {
    this.invitationCode = invitationCode;
  }

  // Initialize browser and page
  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  // Generate random account data
  generateAccountData(email: string): ManusAccountData {
    const firstNames = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
      'Sage', 'River', 'Phoenix', 'Rowan', 'Blake', 'Cameron', 'Drew', 'Emery'
    ];
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez'
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;

    // Generate a secure password
    const password = this.generateSecurePassword();

    return {
      fullName,
      email,
      password,
    };
  }

  // Generate a secure password
  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // Navigate to Manus signup page
  async navigateToSignup(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const signupUrl = `https://manus.im/invitation/${this.invitationCode}`;
    await this.page.goto(signupUrl, { waitUntil: 'networkidle2' });
  }

  // Fill the signup form
  async fillSignupForm(accountData: ManusAccountData): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    // Wait for form elements to be available
    await this.page.waitForSelector('input[placeholder="your name"]');
    await this.page.waitForSelector('input[placeholder="mail@domain.com"]');
    await this.page.waitForSelector('input[placeholder="Enter password"]');

    // Fill the form fields
    await this.page.type('input[placeholder="your name"]', accountData.fullName);
    await this.page.type('input[placeholder="mail@domain.com"]', accountData.email);
    await this.page.type('input[placeholder="Enter password"]', accountData.password);

    // Handle hCaptcha - this will require manual intervention or a CAPTCHA solving service
    console.log('Please solve the hCaptcha manually...');
    
    // Wait for hCaptcha to be solved (check for the checkbox to be checked)
    await this.page.waitForFunction(
      () => {
        const checkbox = document.querySelector('iframe[src*="hcaptcha"]');
        return checkbox !== null;
      },
      { timeout: 120000 } // 2 minutes timeout
    );
  }

  // Submit the signup form
  async submitSignupForm(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    // Click the Sign up button
    await this.page.click('button:has-text("Sign up")');
    
    // Wait for navigation or success message
    await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  }

  // Complete email verification
  async completeEmailVerification(verificationLink: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    // Navigate to the verification link
    await this.page.goto(verificationLink, { waitUntil: 'networkidle2' });
    
    // Wait for verification to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Main automation method
  async createAccount(email: string): Promise<AutomationResult> {
    try {
      await this.initialize();
      
      const accountData = this.generateAccountData(email);
      
      await this.navigateToSignup();
      await this.fillSignupForm(accountData);
      
      // Note: This will pause for manual CAPTCHA solving
      console.log('Waiting for manual CAPTCHA solving...');
      
      await this.submitSignupForm();
      
      return {
        success: true,
        message: 'Account creation initiated. Email verification required.',
        accountData,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Account creation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

