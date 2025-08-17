# WorkforceOne Global Admin System

## Overview
Complete global administration portal for monitoring and managing the entire WorkforceOne platform. This system provides comprehensive oversight of customers, health monitoring, user management, and analytics.

## 🎯 Features Implemented

### ✅ **Authentication & Security**
- **Secure Login System** with email + master password authentication
- **Admin-only Access** with configurable admin email list
- **Session Management** with automatic logout and protection
- **Environment-based Security** with configurable secrets

### ✅ **Global Dashboard**
- **Real-time Platform Overview** with key metrics
- **Health Score Monitoring** for entire platform
- **Critical Alerts System** for urgent issues
- **Recent Activity Tracking** across all organizations
- **Revenue Analytics** with growth trends

### ✅ **Organization Management**
- **Complete Customer Directory** with search and filtering
- **Health Score Monitoring** per organization
- **Subscription Status Tracking** (trial, active, expired, etc.)
- **Trial Extension Capabilities** (admin override)
- **Detailed Organization Profiles** with full history
- **Billing and Payment Tracking**

### ✅ **User Management**
- **Global User Directory** across all organizations
- **User Status Control** (ban, unban, activate)
- **Email Confirmation Management** with resend capabilities
- **Role-based Filtering** (admin, manager, employee)
- **User Activity Monitoring** (last sign-in, creation date)
- **Bulk User Operations** for efficient management

### ✅ **Advanced Analytics**
- **Revenue Growth Tracking** with trend analysis
- **Trial Conversion Analytics** and funnel metrics
- **Feature Usage Statistics** across organizations
- **Geographic Distribution** of customers
- **Health Score Distribution** analysis
- **Growth Metrics** for organizations and users

### ✅ **Subscription Management**
- **Trial Extension System** with one-time 10-day extensions
- **Subscription Cancellation** with immediate or end-of-period options
- **Payment Method Tracking** via Stripe integration
- **Billing History** and invoice management
- **Revenue Tracking** with MRR calculations

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd workforceone/global-admin
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Global Admin Security
GLOBAL_ADMIN_SECRET=super_secret_master_password_change_this
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Optional: Stripe for payment monitoring
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
```

### 3. Configure Admin Access
Edit `/lib/supabase.ts` to add your admin email:

```typescript
export const GLOBAL_ADMIN_EMAILS = [
  'your-email@domain.com',  // Replace with your actual email
  'admin@workforceone.com'
]
```

### 4. Run the Admin Portal
```bash
npm run dev
```

The admin portal will be available at: `http://localhost:3001`

## 🔐 Security Features

### **Authentication System**
- **Email Verification**: Only pre-configured admin emails can access
- **Master Password**: Single master password for maximum security
- **Session Management**: Secure token-based sessions with expiry
- **Auto-logout**: Automatic logout on page refresh if not authenticated

### **Access Control**
- **Admin-only Functions**: All management functions require admin authentication
- **Role-based Security**: Different access levels for different operations
- **Secure API Endpoints**: All API calls use Supabase service role for admin access
- **Environment Isolation**: Separate environment from main application

## 📊 Dashboard Features

### **Main Dashboard**
- **Platform Health Score**: Overall system health percentage
- **Key Metrics**: Organizations, users, subscriptions, revenue
- **Critical Alerts**: Automatic alerts for urgent issues
- **Quick Actions**: Fast access to common admin tasks
- **Real-time Data**: Live updates of platform statistics

### **Organization Management**
- **Complete Directory**: All organizations with search and filtering
- **Health Monitoring**: Individual organization health scores
- **Subscription Tracking**: Trial status, payment status, feature usage
- **User Management**: Users per organization with activity tracking
- **Trial Extensions**: One-click trial extensions for qualified organizations
- **Billing Overview**: Payment history and subscription details

### **User Management**
- **Global User Directory**: All users across all organizations
- **Status Management**: Ban, unban, activate users
- **Email Management**: Resend confirmation emails
- **Activity Monitoring**: Last sign-in, account creation, status
- **Role Filtering**: Filter by admin, manager, employee roles
- **Bulk Operations**: Manage multiple users efficiently

### **Analytics Dashboard**
- **Revenue Analytics**: Growth trends, MRR, ARPU calculations
- **Trial Metrics**: Conversion rates, funnel analysis
- **Feature Usage**: Most used features across organizations
- **Geographic Data**: Customer distribution by location
- **Health Distribution**: Organization health score analysis
- **Growth Tracking**: User and organization growth over time

## 🛠 Advanced Features

### **Trial Management**
```typescript
// Extend trial by 10 days (admin override)
const extendTrial = async (orgId: string) => {
  const { data, error } = await supabaseAdmin.rpc('extend_trial', {
    org_id: orgId
  })
  
  if (data.success) {
    console.log('Trial extended:', data.new_trial_end)
  }
}
```

### **User Status Management**
```typescript
// Ban a user
await supabaseAdmin.auth.admin.updateUserById(userId, {
  ban_duration: '876000h' // ~100 years
})

// Unban a user
await supabaseAdmin.auth.admin.updateUserById(userId, {
  ban_duration: 'none'
})
```

### **Health Score Calculation**
The system automatically calculates health scores based on:
- **Subscription Status**: Active vs expired/trial
- **User Activity**: Active users vs total users
- **Last Activity**: Recent usage patterns
- **Support Tickets**: Open support issues
- **Payment Status**: Current on payments

### **Analytics Calculations**
- **MRR**: Monthly Recurring Revenue from active subscriptions
- **ARPU**: Average Revenue Per User calculation
- **Conversion Rate**: Trial to paid conversion percentage
- **Churn Rate**: User and revenue churn tracking
- **Growth Rates**: Month-over-month growth calculations

## 🔧 Customization

### **Adding New Metrics**
1. Update the analytics calculation function
2. Add new UI components to display metrics
3. Create new database queries as needed
4. Update the dashboard layouts

### **Custom Health Score Factors**
Modify the `calculateHealthScore` function in `/lib/utils.ts`:

```typescript
export function calculateHealthScore(org: any): number {
  let score = 100
  
  // Add your custom scoring logic
  if (org.custom_metric < threshold) score -= penalty
  
  return Math.max(0, score)
}
```

### **Additional Admin Functions**
Add new admin functions to the layout navigation and create corresponding pages.

## 🚨 Important Security Notes

1. **Change Default Passwords**: Always change the default master password
2. **Limit Admin Emails**: Only add trusted email addresses to admin list
3. **Use HTTPS**: Always use HTTPS in production
4. **Monitor Access**: Log all admin activities for security audit
5. **Regular Updates**: Keep dependencies updated for security

## 📈 Monitoring & Maintenance

### **Health Monitoring**
- Monitor overall platform health score
- Set up alerts for critical health score drops
- Regular review of organization health trends
- Proactive outreach for struggling organizations

### **Performance Monitoring**
- Track page load times and API response times
- Monitor database query performance
- Set up alerts for system downtime
- Regular backup verification

### **Usage Analytics**
- Monitor admin portal usage patterns
- Track most-used features for optimization
- Regular review of analytics accuracy
- User feedback collection and implementation

## 🆘 Troubleshooting

### **Common Issues**

**Authentication Problems**:
- Verify admin email is in the allowed list
- Check environment variables are set correctly
- Ensure master password matches environment variable

**Data Loading Issues**:
- Verify Supabase service role key has correct permissions
- Check RLS policies allow admin access
- Confirm database connection and network access

**Performance Issues**:
- Monitor database query performance
- Implement caching for frequently accessed data
- Optimize component rendering with React.memo

### **Support**
- Check application logs for error details
- Verify environment configuration
- Test database connectivity
- Review browser console for client-side errors

## 🎯 Deployment

### **Production Deployment**
1. **Build the application**: `npm run build`
2. **Set production environment variables**
3. **Deploy to your hosting platform** (Vercel, Netlify, etc.)
4. **Configure domain and SSL**
5. **Test all functionality in production**

### **Environment Variables for Production**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GLOBAL_ADMIN_SECRET=your_production_master_password
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com
```

The Global Admin System is now ready for production use! 🚀

This comprehensive system gives you complete oversight and control over your WorkforceOne platform, enabling proactive customer success, efficient user management, and data-driven decision making.