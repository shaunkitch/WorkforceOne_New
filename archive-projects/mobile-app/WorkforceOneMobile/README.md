# WorkforceOne Mobile App

A comprehensive mobile application for remote workforce management, built with React Native (Expo) and TypeScript.

## Features

### Core Functionality
- **Authentication**: Login/Signup with multi-tenant organization support
- **Dashboard**: Real-time statistics and quick actions
- **Attendance**: Clock in/out with work hours tracking
- **Time Tracking**: Start/stop timer with task descriptions
- **Tasks**: Create, manage, and track task progress
- **Projects**: Project management with status tracking
- **Teams**: View team members and organizational structure

### Mobile-Specific Features
- **Push Notifications**: Work reminders and updates
- **Offline Support**: Continue working without internet connection
- **Background Sync**: Automatic data synchronization when online
- **Native Performance**: Optimized for mobile devices

## Technology Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Navigation**: React Navigation 7
- **State Management**: React Context + Hooks
- **Styling**: React Native StyleSheet
- **Icons**: Expo Vector Icons (@expo/vector-icons)
- **Storage**: Expo SecureStore + AsyncStorage
- **Notifications**: Expo Notifications
- **Network**: React Native NetInfo

## Project Structure

```
WorkforceOneMobile/
├── App.tsx                 # Main app component
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── lib/
│   ├── supabase.ts        # Supabase client configuration
│   ├── notifications.ts   # Push notification service
│   └── offline.ts         # Offline support and sync
├── navigation/
│   └── AppNavigator.tsx   # Navigation configuration
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   ├── dashboard/
│   │   └── DashboardScreen.tsx
│   ├── AttendanceScreen.tsx
│   ├── TimeTrackingScreen.tsx
│   ├── TasksScreen.tsx
│   ├── ProjectsScreen.tsx
│   └── TeamsScreen.tsx
└── types/
    └── database.ts        # TypeScript database types
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- Physical device or emulator for testing

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Supabase**:
   - Update `lib/supabase.ts` with your Supabase URL and anon key
   - Ensure database tables match the schema from the web app

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device**:
   - Install Expo Go app on your device
   - Scan QR code from terminal
   - Or use: `npm run android` / `npm run ios`

### Build for Production

1. **Configure app.json**:
   - Update app name, version, and bundle identifier
   - Add proper icons and splash screen

2. **Build with EAS**:
   ```bash
   npm install -g @expo/cli
   expo build:android
   expo build:ios
   ```

## Configuration

### Environment Variables
Set up the following in your Supabase project:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Notifications
- Replace `projectId` in `lib/notifications.ts` with your Expo project ID
- Configure notification channels for Android
- Set up APNs for iOS push notifications

### Database Setup
Ensure your Supabase database has the following tables:
- `organizations`
- `profiles` 
- `teams`
- `team_members`
- `projects`
- `tasks`
- `time_entries`
- `attendance`

## Key Features Explained

### Multi-Tenant Authentication
- Users can join existing organizations or create new ones
- Organization-specific data isolation
- Role-based access control (admin, manager, lead, member)

### Offline Support
- Automatic data caching for offline use
- Queue actions when offline for later sync
- Background synchronization when connection returns
- Retry logic for failed sync operations

### Push Notifications
- Work-related notifications (clock in/out, tasks, projects)
- Break reminders and end-of-day notifications
- Configurable notification channels
- Support for both local and push notifications

### Real-Time Data
- Live dashboard statistics
- Automatic data refresh
- Real-time attendance tracking
- Time tracking with live timer

## Development

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Consistent styling with StyleSheet
- Error handling and loading states

### Testing
- Test on both iOS and Android
- Test offline functionality
- Verify push notifications
- Test multi-tenant scenarios

### Performance
- Optimized images and assets
- Efficient data fetching
- Background task handling
- Memory management

## Deployment

### App Store (iOS)
1. Build with EAS Build Service
2. Submit to App Store Connect
3. Configure App Store metadata
4. Submit for review

### Google Play (Android)
1. Build AAB with EAS Build
2. Upload to Google Play Console
3. Configure store listing
4. Submit for review

## Troubleshooting

### Common Issues
- **Build Errors**: Ensure all dependencies are compatible with your Expo SDK version
- **Authentication**: Verify Supabase configuration and RLS policies
- **Notifications**: Check device permissions and Expo project configuration
- **Offline Sync**: Verify network status and queue persistence

### Development Tools
- Use Expo DevTools for debugging
- Check console logs for errors
- Use Flipper for advanced debugging
- Monitor network requests in development

## Support

For technical support or feature requests:
1. Check the main WorkforceOne documentation
2. Review Supabase and Expo documentation
3. Check GitHub issues for known problems
4. Contact the development team

## License

This project is part of the WorkforceOne remote workforce management system.