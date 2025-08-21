# Development Build Setup for Push Notifications

## Why Development Build?
- Enables full push notification functionality
- Removes Expo Go limitations
- Production-ready testing environment

## Setup Steps

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Configure EAS Build
```bash
cd /path/to/mobile-app/WorkforceOneMobile
eas login  # Login to your Expo account
eas build:configure
```

### 3. Create Development Build
```bash
# For Android
eas build --profile development --platform android

# For iOS (requires Apple Developer Account)
eas build --profile development --platform ios
```

### 4. Install on Device
- Download the built app from EAS dashboard
- Install on your physical device
- Push notifications will work fully

### 5. Run Development Server
```bash
expo start --dev-client
```

## Alternative: Test Without Push Notifications

If you want to test immediately without setting up dev build:
1. All notification functionality works except push notifications
2. Users will see notifications when app is open
3. Real-time updates work perfectly
4. Notification badges and counts work