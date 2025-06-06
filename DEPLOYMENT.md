# Vercel Deployment Guide

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/glodinasflexwork/manus-account-automation)

## Manual Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from the project directory**:
   ```bash
   vercel
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project in Vercel Dashboard
   - Navigate to Settings > Environment Variables
   - Add the following variables:
     ```
     TEXTVERIFIED_API_KEY=your_textverified_api_key_here
     TEXTVERIFIED_USERNAME=your_textverified_username_here
     MAILTRAP_API_TOKEN=your_mailtrap_api_token_here
     MANUS_INVITATION_CODE=QVDRZAYJMTKC
     ```

5. **Redeploy** after setting environment variables:
   ```bash
   vercel --prod
   ```

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `TEXTVERIFIED_API_KEY` | Your TextVerified API V2 key | `r9b8BM356X6MLOqHQu9IlGObx6vibXf9MowYpvhShFAyhfDz4lM6Rpnt6edM` |
| `TEXTVERIFIED_USERNAME` | Your TextVerified username/email | `your-email@example.com` |
| `MAILTRAP_API_TOKEN` | Your Mailtrap API token | `1234567890abcdef` |
| `MANUS_INVITATION_CODE` | Manus invitation code | `QVDRZAYJMTKC` |

## Repository Information

- **GitHub Repository**: https://github.com/glodinasflexwork/manus-account-automation
- **Clone URL**: `git clone https://github.com/glodinasflexwork/manus-account-automation.git`

## Post-Deployment

After successful deployment:

1. **Test the application** with your API credentials
2. **Monitor usage** to stay within API limits
3. **Update environment variables** as needed through Vercel Dashboard

## Troubleshooting

- **Build Errors**: Check that all environment variables are set correctly
- **API Errors**: Verify your TextVerified and Mailtrap credentials
- **Runtime Errors**: Check Vercel function logs in the dashboard

