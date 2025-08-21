# WorkforceOne Mobile Admin App

A React Native mobile application for global administration of the WorkforceOne platform, providing comprehensive oversight and management capabilities on mobile devices.

## Features

- **Authentication**: Secure login with master password verification
- **Dashboard**: Real-time metrics, health monitoring, and critical alerts
- **Organization Management**: Search, filter, health tracking, and trial extensions
- **User Management**: Global user oversight with ban/unban capabilities
- **Analytics**: Interactive charts and key insights with period filtering

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

## Installation

1. Navigate to the mobile admin directory:
```bash
cd /home/shaunkitch/WorkforceOne_New/mobile-admin
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp src/config/config.example.ts src/config/config.ts
```

4. Update the configuration with your Supabase settings in `src/config/config.ts`:
```typescript
export const Config = {
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY',
  },
  app: {
    masterPassword: 'your-secure-master-password',
    theme: {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
    },
  },
}
```

## Development

Start the development server:
```bash
npx expo start
```

### Running on iOS
```bash
npx expo start --ios
```

### Running on Android
```bash
npx expo start --android
```

## Project Structure

```
mobile-admin/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (Auth)
│   ├── lib/               # Utilities and services
│   │   ├── supabase.ts    # Supabase admin client
│   │   └── utils.ts       # Helper functions
│   ├── navigation/        # Navigation setup
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── OrganizationsScreen.tsx
│   │   ├── UsersScreen.tsx
│   │   └── AnalyticsScreen.tsx
│   └── config/           # App configuration
├── App.tsx              # Main app component
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Security Configuration

1. **Master Password**: Set a strong master password in the config file
2. **Service Role Key**: Use Supabase service role key for admin operations
3. **Secure Storage**: User sessions are stored securely using Expo SecureStore

## Key Capabilities

### Dashboard
- Real-time platform metrics
- System health monitoring
- Critical alerts and notifications
- Quick action cards

### Organization Management
- Search and filter organizations
- Health score tracking
- Trial extension capabilities
- Subscription status monitoring

### User Management
- Global user search and filtering
- Ban/unban user capabilities
- Email confirmation resending
- Role and status management

### Analytics
- Revenue growth charts
- Organization growth tracking
- Trial conversion metrics
- Health distribution analysis

## Build for Production

### iOS
```bash
npx eas build --platform ios
```

### Android
```bash
npx eas build --platform android
```

## Environment Variables

The app uses configuration files instead of environment variables for better type safety. Update `src/config/config.ts` with your specific values.

## Troubleshooting

1. **Metro bundler issues**: Clear cache with `npx expo start -c`
2. **Dependency conflicts**: Delete `node_modules` and run `npm install`
3. **iOS simulator issues**: Reset simulator from Device > Erase All Content and Settings
4. **Android emulator issues**: Wipe data from AVD Manager

## Support

For issues related to the mobile admin app, contact the development team or check the main WorkforceOne documentation.