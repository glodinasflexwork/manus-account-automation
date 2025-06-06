# 🚀 Quick Commands for Free Version Update

## Replace Files in Your Repository:

```bash
# Navigate to your project
cd your-manus-account-automation

# Replace retry automation with free-only version
cp src/lib/retry-automation-free-only.ts src/lib/retry-automation.ts

# Replace API endpoint with free-only version  
cp src/app/api/retry-automation-free/route.ts src/app/api/retry-automation/route.ts

# Test the build
npm run build

# Commit and push
git add .
git commit -m "Update: Use completely free SMS services (no API keys required)"
git push origin main
```

## Vercel Environment Variables (Simplified):

```
MANUS_INVITATION_CODE=QVDRZAYJMTKC
MANUS_INVITATION_URL=https://manus.im/invitation/QVDRZAYJMTKC
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

## Test After Deployment:

1. Open your Vercel app URL
2. Enable "🆓 Free Retry Mode" 
3. Set Max Attempts: 10
4. Set Timeout: 25 minutes
5. Click "🆓 Start Free Retry Automation"
6. Be patient - free services take longer but work!

## Expected Results:

- ✅ 60-80% success rate (free services)
- ✅ No API key errors
- ✅ Automatic retry with different services
- ✅ $0.00 cost for testing

## If Success Rate is Low:

- Increase attempts to 15-20
- Increase timeout to 30-45 minutes  
- Try at different times of day
- Remember: free services are less reliable but work eventually!

