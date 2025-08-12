# WorkforceOne Mobile - Google Play Store Publication Steps

## Current Status ✅
- EAS CLI installed and configured
- You are logged in as: **shaunkitch**
- App configuration is complete and ready for build
- All required permissions and privacy policies are set

## Step 1: Create EAS Project (REQUIRED)

Since the automated project creation isn't working, you need to create the project manually:

1. **Open a terminal in this directory**:
   ```bash
   cd /home/shaunkitch/WorkforceOne_New/mobile-app/WorkforceOneMobile
   ```

2. **Run the interactive project init** (you'll need to answer prompts):
   ```bash
   eas project:init
   ```
   - When asked "Would you like to create a project for @shaunkitch/workforceone-mobile?" → Type **y** and press Enter

3. **Alternatively, create project via Expo website**:
   - Go to https://expo.dev/accounts/shaunkitch
   - Click "Create a project"
   - Project name: "workforceone-mobile"
   - Copy the generated project ID and update app.json manually

## Step 2: Build Production APK/AAB

Once the project is created, run the build:

```bash
eas build --platform android --profile production
```

This will:
- Create an Android App Bundle (.aab file) suitable for Google Play Store
- Handle app signing automatically
- Provide download link when complete
- Take approximately 10-15 minutes

## Step 3: Create Google Play Console Account

While the build is running:

1. **Go to Google Play Console**: https://play.google.com/console/
2. **Sign up for developer account** ($25 one-time fee)
3. **Complete identity verification**
4. **Accept Developer Distribution Agreement**

## Step 4: Upload Privacy Policy

You need to host your privacy policy online:

1. **Option A: Use GitHub Pages** (Free):
   - Create a repository called "workforceone-privacy"
   - Upload `PRIVACY_POLICY.md` as `index.html`
   - Enable GitHub Pages
   - URL: https://shaunkitch.github.io/workforceone-privacy

2. **Option B: Use your website** (if you have one):
   - Upload privacy policy to your domain
   - URL: https://yourdomain.com/privacy-policy

3. **Option C: Use free hosting** (Netlify, Vercel):
   - Deploy privacy policy to any free hosting platform

## Step 5: Create App Store Assets

You need to create these visual assets:

### Required Assets:
1. **App Icon**: 512x512 PNG (high-resolution version of your existing icon)
2. **Feature Graphic**: 1024x500 PNG (banner image for store listing)
3. **Screenshots**: At least 2 phone screenshots
   - Recommended size: 1080x1920 or 1080x2340 pixels
   - Show key app features (dashboard, attendance, tasks, etc.)

### Create Screenshots:
- Use an Android emulator or physical device
- Capture screenshots of:
  1. Login/Dashboard screen
  2. Attendance tracking screen
  3. Task management screen
  4. Team/projects overview

## Step 6: Google Play Console Setup

1. **Create new app in console**:
   - App name: "WorkforceOne Mobile"
   - Language: English (or your preference)
   - App or Game: App
   - Free or Paid: Free

2. **Complete App Information**:
   - Category: Business
   - Tags: workforce, attendance, productivity
   - Privacy Policy URL: (from Step 4)

3. **Upload Store Assets**:
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (at least 2)

4. **Store Listing**:
   - Short description: "Complete workforce management: attendance, time tracking, tasks & team collaboration"
   - Full description: (use content from `STORE_DESCRIPTION.md`)

## Step 7: Upload App Bundle

1. **Download AAB file** from EAS build (Step 2)
2. **Go to Release > Production** in Play Console
3. **Create new release**
4. **Upload the .aab file**
5. **Add release notes**:
   ```
   Initial release of WorkforceOne Mobile
   - GPS-based attendance tracking
   - Time management and tracking
   - Task and project management  
   - Team collaboration tools
   - Real-time notifications
   ```

## Step 8: Review and Submit

1. **Complete all required sections** in Play Console
2. **Review app content rating** (should be "Everyone")
3. **Set up pricing and distribution**:
   - Free app
   - Available countries: Select all or specific regions
4. **Submit for review**

## Step 9: Monitor Review Process

- **Review time**: Typically 1-7 days
- **Check email** for Google Play updates
- **Address any feedback** if app is rejected
- **Publish** once approved

## Commands Summary

```bash
# Navigate to app directory
cd /home/shaunkitch/WorkforceOne_New/mobile-app/WorkforceOneMobile

# Create EAS project (interactive)
eas project:init

# Build production AAB
eas build --platform android --profile production

# Check build status
eas build:list

# Alternative: Submit directly to Play Store (after setting up service account)
eas submit --platform android
```

## Important Notes

- **Package name**: `com.workforceone.mobile` (cannot be changed after publication)
- **Version**: 1.0.0 (versionCode: 1)
- **Build time**: 10-15 minutes typically
- **Review time**: 1-7 days usually
- **Developer fee**: $25 one-time payment to Google

## Troubleshooting

If build fails:
1. Check `eas build:list` for error details
2. Ensure all dependencies are installed: `npm install`
3. Check EAS project is configured: `eas project:info`

## Next Steps After Publication

1. Monitor app performance and reviews
2. Set up app updates using `eas build` and `eas submit`  
3. Consider adding analytics (Firebase/Google Analytics)
4. Plan feature updates and improvements

---

**Status: Ready for Step 1 - Create EAS Project**

Run the commands above to start the publication process!