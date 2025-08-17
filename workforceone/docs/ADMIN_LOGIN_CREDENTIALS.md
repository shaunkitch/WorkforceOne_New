# Admin Login Credentials

## 🔐 Global Admin & Mobile Admin Access

Both the **Global Admin Portal** and **Mobile Admin App** use the same authentication credentials for secure access to platform administration.

### Login Credentials
```
📧 Email: admin@workforceone.co.za
🔑 Password: ShaMel@2025
```

## 🌐 Global Admin Portal
- **URL**: http://localhost:3001 (when running locally)
- **Purpose**: Web-based global administration
- **Features**: 
  - Complete platform oversight
  - Organization management
  - User administration
  - Analytics and reporting
  - Trial extensions

## 📱 Mobile Admin App
- **Platform**: React Native (iOS/Android)
- **Purpose**: Mobile global administration
- **Features**:
  - Real-time dashboard
  - Organization management on-the-go
  - User management
  - Analytics with charts
  - Trial extension capabilities

## 🔧 Configuration Files Updated

### Global Admin Portal
- **Environment**: `/workforceone/global-admin/.env.local`
- **Service Role Access**: ✅ Configured
- **Master Password**: ✅ Set to `ShaMel@2025`
- **Admin Email**: ✅ Set to `admin@workforceone.co.za`

### Mobile Admin App
- **Configuration**: `/mobile-admin/src/config/config.ts`
- **Service Role Access**: ✅ Configured
- **Master Password**: ✅ Set to `ShaMel@2025`
- **Admin Email**: ✅ Set to `admin@workforceone.co.za`
- **Allowed Emails**: ✅ Includes both admin@workforceone.co.za and shaun@workforceone.com

## 🚀 How to Start

### Global Admin Portal
```bash
cd /home/shaunkitch/WorkforceOne_New/workforceone/global-admin
npm install
npm run dev
# Access at: http://localhost:3001
```

### Mobile Admin App
```bash
cd /home/shaunkitch/WorkforceOne_New/mobile-admin
npm install
npx expo start
# Scan QR code with Expo Go app
```

## 🔐 Security Features

- **Master Password Authentication**: Both apps require the master password
- **Email Verification**: Only allowed email addresses can access
- **Service Role Access**: Direct database access for admin operations
- **Session Management**: Secure token-based authentication
- **Activity Logging**: All admin actions are logged in the database

## 📊 Available Functions

Both admin interfaces provide:
- ✅ **Platform Analytics** - Real-time metrics and insights
- ✅ **Organization Management** - Health scores, trial extensions
- ✅ **User Administration** - Ban/unban, role management
- ✅ **Trial Extensions** - One-time 10-day extensions
- ✅ **Health Monitoring** - System alerts and notifications
- ✅ **Activity Logging** - Audit trail of all admin actions

## 🗄️ Database Requirements

Make sure you've run the required migrations:
1. `050_pricing_and_subscriptions.sql`
2. `051_subscription_functions.sql` 
3. `052_stripe_integration.sql`
4. `053_global_admin_system.sql` ⭐ **NEW - Required for admin functionality**

---

**⚠️ Security Note**: Keep these credentials secure and only share with authorized personnel. The global admin has complete access to all platform data and operations.