# 📧 SendGrid Setup Guide for WorkforceOne AI Incident Management

## Quick Setup (5 minutes)

### Step 1: Create Free SendGrid Account
1. Go to [SendGrid Free Account](https://signup.sendgrid.com/)
2. Sign up with admin@workforceone.co.za (or any email you can access)
3. Verify your email address
4. Complete account setup

### Step 2: Get Your API Key
1. Login to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose **Restricted Access**
5. Give it a name: "WorkforceOne AI Alerts"
6. Select these permissions:
   - **Mail Send**: Full Access
   - **Marketing**: No Access
   - **Stats**: Read Access (optional)
7. Click **Create & View**
8. **COPY THE API KEY NOW** (you can't see it again!)

### Step 3: Configure Single Sender Verification
Since it's a free account, you need to verify your sender email:

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the form:
   - **From Name**: WorkforceOne Alerts
   - **From Email**: admin@workforceone.co.za
   - **Reply To**: admin@workforceone.co.za
   - **Company Address**: Your company details
4. Click **Create**
5. **Check your email** and click the verification link

### Step 4: Update Environment Variables
Copy your SendGrid API key and update `.env.local`:

```bash
# Email Configuration - SendGrid (Recommended)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-actual-sendgrid-api-key-here
FROM_EMAIL=admin@workforceone.co.za
FROM_NAME=WorkforceOne Alerts
ADMIN_EMAIL=admin@workforceone.co.za

# Remove or comment out SMTP settings when using SendGrid
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

### Step 5: Test Email Delivery
1. Restart your development server: `npm run dev -- -p 3002`
2. Go to: http://localhost:3002/dashboard/incidents
3. Click **"Test Alert"** button
4. Check admin@workforceone.co.za for the test email

## Free Tier Limits
- **100 emails/day** - Perfect for incident alerts
- **Single sender verification** - Must use verified email address
- **No custom domain** - Uses sendgrid.net infrastructure

## API Key Format
Your SendGrid API key will look like:
```
SG.1234567890abcdef.1234567890abcdef1234567890abcdef12345678
```

## Troubleshooting

### "Email not received"
1. Check spam/junk folder
2. Verify sender email is verified in SendGrid
3. Check SendGrid Activity Feed for delivery status
4. Ensure API key has Mail Send permissions

### "API Key Invalid"
1. Make sure you copied the full API key (starts with `SG.`)
2. Check API key permissions include Mail Send
3. Restart the development server after updating .env.local

### "Sender Not Verified"
1. Go to SendGrid → Settings → Sender Authentication
2. Complete single sender verification
3. Use the same email in FROM_EMAIL that you verified

## Next Steps After Setup
Once SendGrid is working:
1. ✅ Critical incidents will automatically send email alerts
2. ✅ AI analysis will be included in email content
3. ✅ Real-time incident detection every 30 seconds
4. ✅ Rich HTML email formatting with incident details

## Example Test Email
After setup, you'll receive a professional test email like this:

**Subject**: ✅ WorkforceOne Email Test - Configuration Successful

The email will include:
- ✅ Configuration confirmation
- 🤖 AI monitoring capabilities summary
- 📊 Current system status
- 🔗 Direct links to your incident dashboard

Your AI incident management system is almost ready! 🚀