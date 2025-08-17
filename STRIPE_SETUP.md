# Stripe Payment Integration Setup Guide

## Overview
Complete payment system with 14-day free trials, one-time 10-day extensions, and Stripe integration for Vercel deployment.

## Features Implemented
✅ **14-day free trial** with automatic activation  
✅ **One-time trial extension** (10 additional days)  
✅ **Trial notifications** with countdown and urgency indicators  
✅ **Stripe payment processing** optimized for Vercel  
✅ **Webhook handling** for payment confirmation  
✅ **Feature unlocking** after successful payment  
✅ **Regional currency support** with automatic conversion  
✅ **Payment success page** with subscription details  

## Setup Instructions

### 1. Stripe Account Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Set up webhook endpoints (see below)

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # From Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_...                   # From Stripe Dashboard  
STRIPE_WEBHOOK_SECRET=whsec_...                 # From Webhook setup

# Existing variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CLAUDE_API_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3. Database Migration
Run the new migration to add Stripe integration:

```sql
-- Run in Supabase SQL Editor
-- File: database/migrations/052_stripe_integration.sql
```

### 4. Stripe Webhook Setup
1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.deleted`
5. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 5. Vercel Deployment
1. Deploy to Vercel: `vercel deploy`
2. Add environment variables in Vercel dashboard
3. Test webhook endpoint: `https://your-app.vercel.app/api/stripe/webhook`

## How It Works

### Trial System
1. **New organizations** get 14-day free trial automatically
2. **Trial notifications** appear when ≤ 5 days remaining
3. **Extension offer** available once per organization (10 days)
4. **Expired trials** lock premium features until payment

### Payment Flow
1. User clicks **"Upgrade Now"** or **"Reactivate Account"**
2. **Payment checkout** opens with order summary
3. **Stripe processes** payment securely
4. **Webhook confirms** payment and activates subscription
5. **Features unlock** immediately after confirmation
6. **Success page** shows subscription details

### Feature Access Control
```typescript
import { useFeatureAccess } from '@/lib/feature-access'

function MyComponent() {
  const { hasAccess, loading } = useFeatureAccess('ai_form_scanner')
  
  if (loading) return <Loading />
  if (!hasAccess) return <UpgradePrompt />
  
  return <PremiumFeature />
}
```

## Components Created

### 1. TrialNotification (`/components/trial-notification.tsx`)
- Smart trial countdown with urgency levels
- One-time extension button (10 days)
- Upgrade call-to-action
- Automatic dismissal options

### 2. PaymentCheckout (`/components/payment-checkout.tsx`)
- Stripe Elements integration
- Order summary with currency conversion
- Secure card processing
- Error handling and loading states

### 3. Payment Success Page (`/app/payment/success/page.tsx`)
- Payment confirmation
- Subscription details
- Next steps guidance
- Support information

## API Endpoints

### 1. Create Payment Intent (`/api/stripe/create-payment-intent/route.ts`)
- Calculates pricing based on features
- Creates Stripe customer if needed
- Returns payment intent for frontend

### 2. Webhook Handler (`/api/stripe/webhook/route.ts`)
- Verifies webhook signatures
- Processes payment events
- Activates subscriptions
- Handles failures

## Database Functions

### 1. `extend_trial(org_id UUID)`
- Extends trial by 10 days (one-time only)
- Marks extension as used
- Admin-only access

### 2. `get_trial_status(org_id UUID)`
- Returns detailed trial information
- Days remaining, extension status
- Expiration checking

### 3. `activate_subscription(org_id UUID, payment_method_id UUID)`
- Activates paid subscription
- Sets billing period dates
- Links payment method

## Testing

### Test Card Numbers (Stripe)
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **3D Secure**: `4000002500003155`

### Test Flow
1. Create new organization (starts trial)
2. Wait or modify trial end date in database
3. Test extension mechanism
4. Test payment flow with test cards
5. Verify webhook processing
6. Check feature unlocking

## Security Features
- ✅ **Webhook signature verification**
- ✅ **Admin-only subscription management**
- ✅ **Row-level security** on all tables
- ✅ **Server-side payment validation**
- ✅ **Encrypted card data** (handled by Stripe)

## Monitoring
- Check Stripe Dashboard for payment events
- Monitor webhook deliveries
- Review Supabase logs for database errors
- Set up Vercel function monitoring

## Support
- Stripe payment issues: Check Stripe logs
- Database errors: Check Supabase logs
- Feature access: Verify RLS policies
- Trial extensions: Check subscription metadata

## Next Steps
1. **Set up Stripe account** and webhooks
2. **Deploy to Vercel** with environment variables
3. **Test payment flow** with test cards
4. **Configure monitoring** and alerts
5. **Train support team** on trial/payment system

The system is now production-ready for Vercel deployment with full Stripe integration! 🚀