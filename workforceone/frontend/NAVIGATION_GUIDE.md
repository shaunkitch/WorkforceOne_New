# 🗺️ Frontend Navigation Guide

## 🎯 TWO MAIN APPLICATIONS

### 1️⃣ **Main Unified App** (`/workforceone/frontend/`)
- Full-featured application with all products
- Located at: `/WorkforceOne_New/workforceone/frontend/`
- Runs on: `http://localhost:3000`

### 2️⃣ **Separated Guard App** (`/workforceone-separated/guard/`) ✅ MOST COMPLETE
- Dedicated guard management application  
- Located at: `/WorkforceOne_New/workforceone-separated/guard/`
- Runs on: `http://localhost:3003`
- **This has the most working guard-specific features!**

## ✅ Key Working Features & Their Locations

### 🔐 Authentication & Invitations
- **QR Code Generator**: `/components/mobile/ProductInvitationQR.tsx`
- **Login Page**: `/app/login/page.tsx`
- **Signup Page**: `/app/signup/page.tsx`
- **Product Access Guard**: `/components/guards/RequireProduct.tsx`

### 📊 Main Dashboards (With Real Data)
- **Guard Management Dashboard**: `/app/dashboard/guard/page.tsx` ✅ Real data integration
- **Security Dashboard**: `/app/dashboard/security/page.tsx` ✅ Real guard locations
- **Main Dashboard**: `/app/dashboard/page.tsx` - Product selector
- **Product Dashboard Component**: `/app/dashboard/ProductDashboard.tsx`

### 🛡️ Security & Guard Features
- **Security Map (Live Guards)**: `/app/dashboard/security/map/page.tsx`
- **Security Routes**: `/app/dashboard/security/routes/page.tsx`
- **QR Code Generator**: `/components/security/QRCodeGenerator.tsx`
- **Route Management Map**: `/components/security/RouteManagementMap.tsx`
- **Security Map Component**: `/components/security/SecurityMap.tsx`

### 📝 Forms System
- **Forms Dashboard**: `/app/dashboard/forms/page.tsx`
- **Form Builder**: `/app/dashboard/forms/builder/[id]/page.tsx`
- **Form Scanner**: `/app/dashboard/forms/scan/page.tsx`
- **Form Submissions**: `/app/dashboard/forms/submissions/page.tsx`
- **Form Analytics**: `/app/dashboard/forms/analytics/[id]/page.tsx`

### 👥 Team & Project Management
- **Teams**: `/app/dashboard/teams/page.tsx`
- **Projects**: `/app/dashboard/projects/page.tsx`
- **Tasks**: `/app/dashboard/tasks/page.tsx`

### ⏰ Time & Attendance
- **Time Tracker**: `/app/dashboard/time-tracker/page.tsx`
- **Attendance**: `/app/dashboard/attendance/page.tsx`
- **Leave Management**: `/app/dashboard/leave/page.tsx`

### 💳 Billing & Subscriptions
- **Billing Dashboard**: `/app/billing/page.tsx`
- **Subscription Manager**: `/components/billing/SubscriptionManager.tsx`
- **Usage Tracker**: `/components/billing/UsageTracker.tsx`
- **Pricing Calculator**: `/app/pricing-calculator/page.tsx`

### 🔧 Settings & Configuration
- **Settings Main**: `/app/dashboard/settings/page.tsx`
- **Feature Flags**: `/app/dashboard/settings/features/page.tsx`
- **Invitations**: `/app/dashboard/settings/invitations/page.tsx`

### 🗺️ Navigation Components
- **Product Navigation**: `/components/navigation/ProductNavigation.tsx`
- **Product Switcher**: `/components/navigation/ProductSwitcher.tsx`

## 🚀 Quick Access to Key Files

### Yesterday's Work (QR & Real Data)
1. **QR Invitation Component**: `components/mobile/ProductInvitationQR.tsx`
2. **Guard Dashboard (Real Data)**: `app/dashboard/guard/page.tsx`
3. **Security Page (Real Data)**: `app/dashboard/security/page.tsx`
4. **Security Map (Real Guards)**: `app/dashboard/security/map/page.tsx`

### API Routes
- **Forms Scanning API**: `/app/api/forms/scan/route.ts`
- **Stripe Webhook**: `/app/api/stripe/webhook/route.ts`
- **Payment Intent**: `/app/api/stripe/create-payment-intent/route.ts`

### Utility Libraries
- **Supabase Client**: `/lib/supabase/client.ts`
- **Feature Access**: `/lib/feature-access.ts`
- **Route Optimization**: `/lib/routeOptimization.ts`
- **Google Maps**: `/lib/google-maps.ts`

## 📁 Suggested Quick Navigation Structure

To quickly access working features, use these paths:

```
dashboard/
├── guard/          # ✅ Guard management with real data
├── security/       # ✅ Security operations  
│   ├── map/       # ✅ Live guard tracking
│   └── routes/    # Route management
├── forms/         # Form management system
├── teams/         # Team management
├── projects/      # Project tracking
└── settings/      # System configuration
```

## 🎯 Production-Ready Features

These features are fully functional with real database integration:

1. **Guard Management System** (`/dashboard/guard`)
   - Real-time guard count from database
   - Integration with user_products table
   - QR invitation system working

2. **Security Dashboard** (`/dashboard/security`)
   - Live guard locations
   - Patrol management
   - Incident reporting

3. **QR Code System** (`/components/mobile/ProductInvitationQR.tsx`)
   - Generate invitation QR codes
   - Auto sign-in functionality
   - Product access management

4. **Forms System** (`/dashboard/forms`)
   - AI-powered form scanning
   - Dynamic form builder
   - Submission tracking

## 🔍 Finding Features

To find specific features quickly:

1. **Guard/Security features**: Look in `/app/dashboard/guard/` or `/app/dashboard/security/`
2. **QR/Invitation features**: Check `/components/mobile/` or `/components/security/`
3. **Form features**: Navigate to `/app/dashboard/forms/`
4. **Settings/Config**: Go to `/app/dashboard/settings/`
5. **Components**: All reusable components in `/components/`

## 💡 Development Tips

- Main working dashboards are under `/app/dashboard/`
- All API routes are under `/app/api/`
- Shared components are in `/components/`
- Utility functions are in `/lib/`
- UI primitives are in `/components/ui/`