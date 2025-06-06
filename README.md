# Manus Account Automation

A Next.js application that automates Manus account creation using TextVerified.com API for phone numbers and Mailtrap API for email addresses.

## Features

- 🤖 **Automated Account Creation**: Streamlined process for creating Manus accounts
- 📧 **Email Integration**: Uses Mailtrap API for temporary email addresses
- 📱 **Phone Verification**: Integrates with TextVerified for phone number verification
- 🎨 **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS
- 🔒 **Secure**: Environment-based configuration for API credentials
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Automation**: Puppeteer for browser automation
- **APIs**: TextVerified.com, Mailtrap
- **Icons**: Lucide React

## Prerequisites

Before running this application, you need:

1. **TextVerified Account**: Sign up at [textverified.com](https://textverified.com)
   - Get your API V2 Key from the API settings
   - Note your username/email used for registration

2. **Mailtrap Account**: Sign up at [mailtrap.io](https://mailtrap.io)
   - Get your API token from the API settings
   - Set up at least one inbox for testing

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd manus-account-automation
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   TEXTVERIFIED_API_KEY=your_textverified_api_key_here
   TEXTVERIFIED_USERNAME=your_textverified_username_here
   MAILTRAP_API_TOKEN=your_mailtrap_api_token_here
   MANUS_INVITATION_CODE=QVDRZAYJMTKC
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## Usage

1. **Configure API Credentials**: Make sure your TextVerified and Mailtrap API credentials are properly set in the environment variables.

2. **Start Account Creation**: Click the "Start Account Creation" button on the main interface.

3. **Monitor Progress**: The application will show real-time progress through these steps:
   - Generate Email Address (using Mailtrap)
   - Get Phone Number (using TextVerified)
   - Create Manus Account (automated browser interaction)
   - Verify Email (automatic email monitoring and verification)

4. **View Results**: Once completed, the application will display the created account credentials.

## API Endpoints

### TextVerified Integration
- `GET /api/textverified` - Get available verification services
- `POST /api/textverified` - Create a new verification
- `GET /api/textverified/[id]` - Check verification status

### Mailtrap Integration
- `GET /api/mailtrap` - Get available inboxes
- `POST /api/mailtrap` - Generate a test email address
- `GET /api/mailtrap/[inboxId]` - Get messages from inbox
- `POST /api/mailtrap/[inboxId]` - Wait for verification email

### Manus Automation
- `POST /api/manus` - Create Manus account
- `PUT /api/manus` - Complete email verification

### Demo Mode
- `POST /api/demo` - Run demo automation (for testing without real APIs)

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── demo/           # Demo automation
│   │   ├── mailtrap/       # Mailtrap integration
│   │   ├── manus/          # Manus automation
│   │   └── textverified/   # TextVerified integration
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page component
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── mailtrap.ts         # Mailtrap API client
│   ├── manus-automation.ts # Manus automation logic
│   ├── textverified.ts     # TextVerified API client
│   └── utils.ts            # Utility functions
└── types/                  # TypeScript type definitions
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TEXTVERIFIED_API_KEY` | Your TextVerified API V2 key | Yes |
| `TEXTVERIFIED_USERNAME` | Your TextVerified username/email | Yes |
| `MAILTRAP_API_TOKEN` | Your Mailtrap API token | Yes |
| `MANUS_INVITATION_CODE` | Manus invitation code | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL for client-side | No |

### Manus Invitation

This application uses the invitation code `QVDRZAYJMTKC` to access the Manus signup page. The invitation provides:
- 1500 credits + 300 daily credits
- No waitlist access

## Deployment

### Vercel Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```

3. **Set environment variables** in the Vercel dashboard under Project Settings > Environment Variables.

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## Important Notes

### Legal and Ethical Considerations

- This tool is for educational and testing purposes only
- Ensure compliance with the terms of service of all platforms involved
- Use responsibly and avoid creating accounts for malicious purposes
- Respect rate limits and API usage guidelines

### Browser Automation

- The application uses Puppeteer for browser automation
- CAPTCHA solving may require manual intervention
- Some operations may need user interaction for security verification

### API Limitations

- TextVerified and Mailtrap have usage limits based on your subscription
- Phone numbers from TextVerified may have geographic restrictions
- Email verification timing depends on Manus's email delivery speed

## Troubleshooting

### Common Issues

1. **API Authentication Errors**:
   - Verify your API credentials are correct
   - Check that your accounts have sufficient credits/quota

2. **Build Errors**:
   - Ensure all dependencies are installed: `npm install`
   - Check TypeScript errors: `npm run type-check`

3. **Browser Automation Issues**:
   - CAPTCHA may require manual solving
   - Network timeouts can be adjusted in the automation settings

4. **Email Verification Timeout**:
   - Increase timeout values in the Mailtrap configuration
   - Check spam folders in the Mailtrap inbox

### Support

For issues related to:
- **TextVerified**: Contact [TextVerified Support](https://textverified.com/support)
- **Mailtrap**: Contact [Mailtrap Support](https://mailtrap.io/support)
- **This Application**: Create an issue in the repository

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release
- TextVerified API integration
- Mailtrap API integration
- Manus account automation
- Modern UI with shadcn/ui components
- TypeScript support
- Responsive design

