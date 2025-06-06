import puppeteer, { Browser, Page } from 'puppeteer';

export class ManusAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    try {
      // Configure Puppeteer for different environments
      const isProduction = process.env.NODE_ENV === 'production';
      
      let browserOptions;
      
      if (isProduction) {
        // Vercel/serverless configuration
        try {
          const chromium = await import('@sparticuz/chromium');
          
          // Configure chromium for Vercel
          await chromium.default.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');
          
          browserOptions = {
            args: [
              ...chromium.default.args,
              '--hide-scrollbars',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
            ],
            defaultViewport: chromium.default.defaultViewport,
            executablePath: await chromium.default.executablePath(),
            headless: chromium.default.headless,
          };
        } catch (error) {
          console.log('Chromium package not available, using fallback configuration');
          // Fallback for production without chromium package
          browserOptions = {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
            ],
          };
        }
      } else {
        // Local development configuration
        browserOptions = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        };
      }

      this.browser = await puppeteer.launch(browserOptions);
      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createManusAccount(email: string, phone?: string): Promise<{
    success: boolean;
    accountData?: {
      email: string;
      phone: string;
      password: string;
      fullName: string;
    };
    error?: string;
  }> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      const invitationUrl = process.env.MANUS_INVITATION_URL || 'https://manus.im/invitation/QVDRZAYJMTKC';
      
      // Navigate to Manus invitation page
      await this.page.goto(invitationUrl, { waitUntil: 'networkidle2' });
      
      // Generate account data
      const fullName = this.generateRandomName();
      const password = this.generateRandomPassword();
      
      // Fill registration form
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill email
      await this.page.type('input[type="email"]', email);
      
      // Fill password
      await this.page.type('input[type="password"]', password);
      
      // Fill full name
      const nameSelector = 'input[name="name"], input[name="fullName"], input[placeholder*="name"]';
      await this.page.waitForSelector(nameSelector, { timeout: 5000 });
      await this.page.type(nameSelector, fullName);
      
      // Fill phone if provided
      if (phone) {
        const phoneSelector = 'input[type="tel"], input[name="phone"], input[placeholder*="phone"]';
        try {
          await this.page.waitForSelector(phoneSelector, { timeout: 5000 });
          await this.page.type(phoneSelector, phone);
        } catch {
          console.log('Phone field not found or not required');
        }
      }
      
      // Submit form
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button:contains("Sign up"), button:contains("Register")');
      if (submitButton) {
        await submitButton.click();
      } else {
        // Fallback: press Enter
        await this.page.keyboard.press('Enter');
      }
      
      // Wait for navigation or success message
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        success: true,
        accountData: {
          email,
          phone: phone || '',
          password,
          fullName,
        },
      };
    } catch (error) {
      console.error('Error creating Manus account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private generateRandomName(): string {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

