# 🗺️ Complete Application Navigation Guide

## 🎯 APPLICATION STRUCTURE

We have **TWO main application structures** with working features:

### 1️⃣ **Separated Guard App** (`/workforceone-separated/guard/`) ✅ MOST GUARD FEATURES
**Location**: `/WorkforceOne_New/workforceone-separated/guard/`  
**Port**: `http://localhost:3003`  
**Status**: ✅ Production Ready with Real Data

#### Guard App Pages (All Working):
```
/workforceone-separated/guard/app/
├── page.tsx                    # ✅ Main dashboard (real guard count)
├── guards/
│   ├── page.tsx               # ✅ Guards list (real database data)
│   └── onboard/
│       └── page.tsx           # Guard onboarding
├── incidents/
│   ├── page.tsx               # Incident list
│   └── create/
│       └── page.tsx           # Create incident
├── security/
│   ├── page.tsx               # Security dashboard
│   ├── map/
│   │   └── page.tsx          # ✅ Live guard map
│   └── routes/
│       └── page.tsx          # Route management
├── checkpoints/
│   └── page.tsx              # QR checkpoints
├── sites/
│   └── page.tsx              # Site management
├── monitoring/
│   └── page.tsx              # Live monitoring
├── operations/
│   └── page.tsx              # Operations center
├── invitations/
│   └── page.tsx              # ✅ QR invitations
└── settings/
    └── page.tsx              # Settings
```

### 2️⃣ **Main Unified App** (`/workforceone/frontend/`)
**Location**: `/WorkforceOne_New/workforceone/frontend/`  
**Port**: `http://localhost:3000`  
**Status**: ✅ Multi-product application

#### Main App Key Pages:
```
/workforceone/frontend/app/dashboard/
├── page.tsx                    # Product selector dashboard
├── guard/
│   └── page.tsx               # ✅ Guard dashboard (real data)
├── security/
│   ├── page.tsx               # ✅ Security operations
│   ├── map/
│   │   └── page.tsx          # ✅ Live guard tracking
│   └── routes/
│       └── page.tsx          # Route planning
├── forms/                     # Complete forms system
├── teams/                     # Team management
├── projects/                  # Project tracking
└── settings/
    └── invitations/
        └── page.tsx          # ✅ QR code generation
```

## 🚀 QUICK START COMMANDS

### To run the Separated Guard App (Recommended for Guard Features):
```bash
cd /home/shaunkitch/WorkforceOne_New/workforceone-separated/guard
npm run dev
# Opens at http://localhost:3003
```

### To run the Main Unified App:
```bash
cd /home/shaunkitch/WorkforceOne_New/workforceone
npm run dev
# Frontend at http://localhost:3000
# Backend at http://localhost:5000
```

## ✅ PRODUCTION-READY FEATURES

### In Separated Guard App (`workforceone-separated/guard/`):
1. **Main Dashboard** (`/app/page.tsx`)
   - Real guard count from database
   - Live statistics
   - Quick actions

2. **Guards List** (`/app/guards/page.tsx`)
   - Shows actual guards from user_products table
   - Real names and emails
   - Status tracking

3. **Security Map** (`/app/security/map/page.tsx`)
   - Live guard locations
   - Real-time updates
   - Patrol tracking

4. **Invitations** (`/app/invitations/page.tsx`)
   - QR code generation
   - Invitation management

### In Main App (`workforceone/frontend/`):
1. **Guard Dashboard** (`/app/dashboard/guard/page.tsx`)
   - Real database integration
   - Live guard statistics

2. **QR Component** (`/components/mobile/ProductInvitationQR.tsx`)
   - Generate invitation QR codes
   - Auto sign-in support

## 📁 KEY COMPONENT LOCATIONS

### Separated Guard App Components:
```
/workforceone-separated/guard/
├── components/
│   ├── navigation/
│   │   └── Navbar.tsx         # Navigation bar
│   ├── ui/                    # UI components
│   └── guards/
│       └── GuardList.tsx      # Guard list component
└── lib/
    ├── supabase/
    │   └── client.ts          # Supabase client
    └── utils.ts               # Utilities
```

### Main App Components:
```
/workforceone/frontend/
├── components/
│   ├── mobile/
│   │   └── ProductInvitationQR.tsx  # ✅ QR generator
│   ├── security/
│   │   ├── SecurityMap.tsx          # Map component
│   │   └── QRCodeGenerator.tsx      # QR utilities
│   └── navigation/
│       └── ProductNavigation.tsx    # Product nav
└── lib/
    └── supabase/
        └── client.ts                 # Supabase client
```

## 🎯 WHICH APP TO USE?

### Use **Separated Guard App** for:
- Pure guard management features
- Cleaner, focused interface
- Guard-specific workflows
- Testing guard functionality
- **Location**: `workforceone-separated/guard/`

### Use **Main Unified App** for:
- Multi-product features
- Integration between products
- Forms, teams, projects
- Billing and subscriptions
- **Location**: `workforceone/frontend/`

## 🔍 FINDING FEATURES QUICKLY

### For Guard Features:
1. **Primary**: Check `/workforceone-separated/guard/app/`
2. **Secondary**: Check `/workforceone/frontend/app/dashboard/guard/`

### For QR/Invitations:
1. **Separated App**: `/workforceone-separated/guard/app/invitations/`
2. **Main App**: `/workforceone/frontend/components/mobile/ProductInvitationQR.tsx`

### For Security Map:
1. **Separated App**: `/workforceone-separated/guard/app/security/map/`
2. **Main App**: `/workforceone/frontend/app/dashboard/security/map/`

## 📊 DATABASE INTEGRATION STATUS

Both applications connect to the same Supabase database:
- **Tables Used**: `user_products`, `profiles`, `security_guard_invitations`
- **Real Data**: ✅ Both apps show real guard data
- **QR System**: ✅ Working with auto sign-in
- **Mobile App**: ✅ Connects and scans QR codes

## 💡 DEVELOPMENT TIPS

1. **Start with Separated Guard App** - It's more focused and easier to navigate
2. **Check both locations** - Some features exist in both apps
3. **Use the dev dashboard** - `/dashboard/dev` in main app for quick navigation
4. **Database is shared** - Changes in one app reflect in the other

## 🚦 Current Status

- **Separated Guard App**: 🟢 Production Ready
- **Main Unified App**: 🟢 Production Ready  
- **Mobile App**: 🟢 QR Scanning Working
- **Database**: 🟢 Real Data Integration Active