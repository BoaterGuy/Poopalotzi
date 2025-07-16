# Email Setup Guide

## Setting up Brevo Email Service

### 1. Get Brevo API Key
1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Sign in or create account
3. Navigate to Settings → API Keys
4. Create a new API key with "Send emails" permission
5. Copy the API key (starts with `xkeysib-`)

### 2. Configure in Replit
1. Open your Replit project
2. Click on the "Secrets" tab (lock icon)
3. Add these environment variables:

```
BREVO_API_KEY=xkeysib-your-actual-api-key-here
ADMIN_EMAIL=your-admin-email@example.com
BREVO_FROM_EMAIL=your-verified-sender@example.com
```

### 3. Verify Sender Email
1. In Brevo dashboard, go to Settings → Sender Settings
2. Add and verify your sender email address
3. Use this verified email as `BREVO_FROM_EMAIL`

### 4. Test Email Functionality
- Contact form submissions will go to `ADMIN_EMAIL`
- Service notifications will be sent from `BREVO_FROM_EMAIL`
- Without API key, emails will be simulated (logged to console)

## Security Notes
- Never commit API keys to code
- Use Replit Secrets for all sensitive data
- API keys should start with `xkeysib-` for Brevo
- Always validate email addresses before sending

## Troubleshooting
- Check server logs for email simulation messages
- Verify API key format and permissions
- Ensure sender email is verified in Brevo
- Test with contact form on your website