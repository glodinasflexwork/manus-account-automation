import axios from 'axios';
import * as cheerio from 'cheerio';

// Types for SMS services
interface SMSNumber {
  number: string;
  id: string;
  service: string;
  country: string;
}

interface SMSMessage {
  code: string;
  message: string;
  timestamp: Date;
}

export class FreeSMSService {
  private services = [
    'receive-sms-online.info',
    'sms-online.co',
    'freesmsverification.com',
    'receive-sms.cc',
    'sms24.me',
    'receivesmsonline.net'
  ];

  // Service 1: Receive-SMS-Online.info
  async getNumberFromReceiveSMSOnline(): Promise<SMSNumber | null> {
    try {
      console.log('🔍 Trying Receive-SMS-Online.info...');
      const response = await axios.get('https://receive-sms-online.info/', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const phoneNumbers: SMSNumber[] = [];

      // Look for phone numbers in the page
      $('.number, .phone-number, [data-phone]').each((i, element) => {
        const numberText = $(element).text().trim();
        const phoneMatch = numberText.match(/\+?1?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/);
        
        if (phoneMatch) {
          phoneNumbers.push({
            number: phoneMatch[0],
            id: `rsmo_${i}`,
            service: 'receive-sms-online.info',
            country: 'US'
          });
        }
      });

      if (phoneNumbers.length > 0) {
        console.log(`✅ Found ${phoneNumbers.length} numbers from Receive-SMS-Online.info`);
        return phoneNumbers[0]; // Return first available number
      }

      return null;
    } catch (error) {
      console.log('❌ Receive-SMS-Online.info failed:', error);
      return null;
    }
  }

  // Service 2: SMS-Online.co
  async getNumberFromSMSOnline(): Promise<SMSNumber | null> {
    try {
      console.log('🔍 Trying SMS-Online.co...');
      const response = await axios.get('https://sms-online.co/receive-free-sms', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const phoneNumbers: SMSNumber[] = [];

      // Look for phone numbers
      $('.number-boxes .number-box, .phone-list .phone-item').each((i, element) => {
        const numberText = $(element).find('.number, .phone').text().trim();
        const phoneMatch = numberText.match(/\+?1?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/);
        
        if (phoneMatch) {
          phoneNumbers.push({
            number: phoneMatch[0],
            id: `smo_${i}`,
            service: 'sms-online.co',
            country: 'US'
          });
        }
      });

      if (phoneNumbers.length > 0) {
        console.log(`✅ Found ${phoneNumbers.length} numbers from SMS-Online.co`);
        return phoneNumbers[0];
      }

      return null;
    } catch (error) {
      console.log('❌ SMS-Online.co failed:', error);
      return null;
    }
  }

  // Service 3: FreeSMSVerification.com
  async getNumberFromFreeSMSVerification(): Promise<SMSNumber | null> {
    try {
      console.log('🔍 Trying FreeSMSVerification.com...');
      const response = await axios.get('https://freesmsverification.com/', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const phoneNumbers: SMSNumber[] = [];

      // Look for phone numbers
      $('.number-list .number, .phone-numbers .phone').each((i, element) => {
        const numberText = $(element).text().trim();
        const phoneMatch = numberText.match(/\+?1?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/);
        
        if (phoneMatch) {
          phoneNumbers.push({
            number: phoneMatch[0],
            id: `fsv_${i}`,
            service: 'freesmsverification.com',
            country: 'US'
          });
        }
      });

      if (phoneNumbers.length > 0) {
        console.log(`✅ Found ${phoneNumbers.length} numbers from FreeSMSVerification.com`);
        return phoneNumbers[0];
      }

      return null;
    } catch (error) {
      console.log('❌ FreeSMSVerification.com failed:', error);
      return null;
    }
  }

  // Service 4: Receive-SMS.cc
  async getNumberFromReceiveSMSCC(): Promise<SMSNumber | null> {
    try {
      console.log('🔍 Trying Receive-SMS.cc...');
      const response = await axios.get('https://receive-sms.cc/', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const phoneNumbers: SMSNumber[] = [];

      // Look for phone numbers
      $('.number-item, .phone-number-item').each((i, element) => {
        const numberText = $(element).find('.number, .phone').text().trim();
        const phoneMatch = numberText.match(/\+?1?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/);
        
        if (phoneMatch) {
          phoneNumbers.push({
            number: phoneMatch[0],
            id: `rscc_${i}`,
            service: 'receive-sms.cc',
            country: 'US'
          });
        }
      });

      if (phoneNumbers.length > 0) {
        console.log(`✅ Found ${phoneNumbers.length} numbers from Receive-SMS.cc`);
        return phoneNumbers[0];
      }

      return null;
    } catch (error) {
      console.log('❌ Receive-SMS.cc failed:', error);
      return null;
    }
  }

  // Service 5: SMS24.me
  async getNumberFromSMS24(): Promise<SMSNumber | null> {
    try {
      console.log('🔍 Trying SMS24.me...');
      const response = await axios.get('https://sms24.me/en/', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const phoneNumbers: SMSNumber[] = [];

      // Look for phone numbers
      $('.number-box, .phone-item').each((i, element) => {
        const numberText = $(element).text().trim();
        const phoneMatch = numberText.match(/\+?1?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/);
        
        if (phoneMatch) {
          phoneNumbers.push({
            number: phoneMatch[0],
            id: `sms24_${i}`,
            service: 'sms24.me',
            country: 'US'
          });
        }
      });

      if (phoneNumbers.length > 0) {
        console.log(`✅ Found ${phoneNumbers.length} numbers from SMS24.me`);
        return phoneNumbers[0];
      }

      return null;
    } catch (error) {
      console.log('❌ SMS24.me failed:', error);
      return null;
    }
  }

  // Service 6: ReceiveSMSOnline.net
  async getNumberFromReceiveSMSOnlineNet(): Promise<SMSNumber | null> {
    try {
      console.log('🔍 Trying ReceiveSMSOnline.net...');
      const response = await axios.get('https://receivesmsonline.net/', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const phoneNumbers: SMSNumber[] = [];

      // Look for phone numbers
      $('.number-list .item, .phone-numbers .number').each((i, element) => {
        const numberText = $(element).text().trim();
        const phoneMatch = numberText.match(/\+?1?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/);
        
        if (phoneMatch) {
          phoneNumbers.push({
            number: phoneMatch[0],
            id: `rsmon_${i}`,
            service: 'receivesmsonline.net',
            country: 'US'
          });
        }
      });

      if (phoneNumbers.length > 0) {
        console.log(`✅ Found ${phoneNumbers.length} numbers from ReceiveSMSOnline.net`);
        return phoneNumbers[0];
      }

      return null;
    } catch (error) {
      console.log('❌ ReceiveSMSOnline.net failed:', error);
      return null;
    }
  }

  // Main method to get phone number with fallback
  async getPhoneNumber(): Promise<SMSNumber | null> {
    console.log('📱 Starting free SMS service search...');
    
    const services = [
      () => this.getNumberFromReceiveSMSOnline(),
      () => this.getNumberFromSMSOnline(),
      () => this.getNumberFromFreeSMSVerification(),
      () => this.getNumberFromReceiveSMSCC(),
      () => this.getNumberFromSMS24(),
      () => this.getNumberFromReceiveSMSOnlineNet()
    ];

    for (let i = 0; i < services.length; i++) {
      try {
        console.log(`🔄 Trying service ${i + 1}/${services.length}...`);
        const result = await services[i]();
        if (result) {
          console.log(`🎉 Successfully got phone number: ${result.number} from ${result.service}`);
          return result;
        }
      } catch (error) {
        console.log(`❌ Service ${i + 1} failed:`, error);
        continue;
      }
    }

    console.log('❌ All free SMS services failed');
    return null;
  }

  // Check for SMS messages (web scraping approach)
  async checkForSMS(phoneNumber: string, service: string): Promise<SMSMessage | null> {
    try {
      console.log(`📨 Checking for SMS on ${phoneNumber} via ${service}...`);
      
      let url = '';
      switch (service) {
        case 'receive-sms-online.info':
          url = `https://receive-sms-online.info/${phoneNumber.replace(/\D/g, '')}`;
          break;
        case 'sms-online.co':
          url = `https://sms-online.co/number/${phoneNumber.replace(/\D/g, '')}`;
          break;
        case 'freesmsverification.com':
          url = `https://freesmsverification.com/number/${phoneNumber.replace(/\D/g, '')}`;
          break;
        case 'receive-sms.cc':
          url = `https://receive-sms.cc/number/${phoneNumber.replace(/\D/g, '')}`;
          break;
        case 'sms24.me':
          url = `https://sms24.me/en/number/${phoneNumber.replace(/\D/g, '')}`;
          break;
        case 'receivesmsonline.net':
          url = `https://receivesmsonline.net/number/${phoneNumber.replace(/\D/g, '')}`;
          break;
        default:
          return null;
      }

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Look for SMS messages containing verification codes
      const messages: SMSMessage[] = [];
      
      $('.message, .sms, .text-message').each((i, element) => {
        const messageText = $(element).text().trim();
        const timeText = $(element).find('.time, .timestamp').text().trim();
        
        // Look for verification codes (6 digits, 4 digits, or "code: XXXXX" patterns)
        const codeMatch = messageText.match(/(?:code|verification|verify)[\s:]*(\d{4,6})|(\d{6})|(\d{4})/i);
        
        if (codeMatch) {
          const code = codeMatch[1] || codeMatch[2] || codeMatch[3];
          messages.push({
            code: code,
            message: messageText,
            timestamp: new Date()
          });
        }
      });

      // Return the most recent message with a verification code
      if (messages.length > 0) {
        const latestMessage = messages[0];
        console.log(`✅ Found SMS code: ${latestMessage.code}`);
        return latestMessage;
      }

      return null;
    } catch (error) {
      console.log(`❌ Failed to check SMS for ${phoneNumber}:`, error);
      return null;
    }
  }

  // Poll for SMS with timeout
  async waitForSMS(phoneNumber: string, service: string, timeoutMinutes = 3): Promise<string | null> {
    console.log(`⏳ Waiting for SMS on ${phoneNumber} (timeout: ${timeoutMinutes} minutes)...`);
    
    const startTime = Date.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const pollInterval = 15000; // Check every 15 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const smsMessage = await this.checkForSMS(phoneNumber, service);
        if (smsMessage && smsMessage.code) {
          console.log(`🎉 Received SMS code: ${smsMessage.code}`);
          return smsMessage.code;
        }

        console.log(`⏳ No SMS yet, waiting ${pollInterval/1000}s before next check...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.log('❌ Error checking SMS:', error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    console.log('⏰ SMS timeout reached');
    return null;
  }

  // Generate a random phone number for testing
  generateRandomPhoneNumber(): SMSNumber {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    
    return {
      number: `+1${areaCode}${exchange}${number}`,
      id: `random_${Date.now()}`,
      service: 'random-generator',
      country: 'US'
    };
  }
}

export default FreeSMSService;

