# 🔧 Quick Fix Commands

## For GitHub Repository Update:

```bash
# Navigate to your project directory
cd your-project-directory

# Replace the broken retry automation file
cp src/lib/retry-automation-fixed.ts src/lib/retry-automation.ts

# Replace the broken API route
cp src/app/api/retry-automation-fixed/route.ts src/app/api/retry-automation/route.ts

# Test the build
npm run build

# Commit and push
git add .
git commit -m "Fix: URL resolution and timeout issues for production"
git push origin main
```

## For Vercel Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
SMS_ACTIVATE_API_KEY=your_free_api_key_here
MANUS_INVITATION_CODE=QVDRZAYJMTKC
MANUS_INVITATION_URL=https://manus.im/invitation/QVDRZAYJMTKC
```

## Get Free SMS-Activate API Key:

1. Visit: https://sms-activate.org/
2. Register for free account
3. Go to Profile → API → Copy key
4. Paste key in Vercel environment variables

## Test After Deployment:

1. Open your Vercel app URL
2. Enable "Smart Retry Mode"
3. Set Max Attempts: 5
4. Set Timeout: 15 minutes
5. Click "Start Smart Retry Automation"
6. Should see progress through all 5 steps without errors

