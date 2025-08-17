# Global Admin Portal Access Guide

## 🔐 **Access Information**

### **Portal URL**
- Development: `http://localhost:3003`
- Production: Deploy to your preferred hosting service

### **Login Credentials**
- **Email**: `admin@workforceone.co.za` or `shaun@workforceone.com`
- **Master Password**: `WorkforceOne@2025Admin`

*Note: Only these email addresses are authorized for global admin access*

## 🚀 **Starting the Portal**

### **From the global-admin directory:**
```bash
cd /home/shaunkitch/WorkforceOne_New/workforceone/global-admin
npm run dev -- -p 3003
```

### **Environment Status**
✅ **Supabase Configuration**: Connected to production database
✅ **Service Role Key**: Configured for full database access
✅ **Authentication**: Master password system active

## 🎯 **Features Available**

### **Dashboard Overview**
- Total organizations and users
- Active subscriptions and revenue
- Trial status monitoring
- System health metrics

### **Organization Management**
- View all organizations
- Monitor subscription status
- Extend trial periods
- Health score tracking

### **User Management**
- Global user overview
- Ban/unban capabilities
- Role management
- Activity monitoring

### **System Monitoring**
- Real-time health scores
- Critical alert management
- Database performance metrics
- Infrastructure monitoring

### **Analytics**
- Revenue tracking
- User growth metrics
- Trial conversion rates
- Platform-wide statistics

## 🔧 **Configuration Files**

### **Environment Variables**
- Location: `/workforceone/global-admin/.env.local`
- Contains Supabase keys and master password

### **Authentication Flow**
1. Access login page at `http://localhost:3003/login`
2. Enter authorized email address
3. Enter master password
4. Token stored in localStorage for session

## 📊 **Database Access**

The global admin uses **service role** access which bypasses Row Level Security (RLS) for complete database oversight.

### **Key Functions Available:**
- `extend_trial()` - Extend organization trials
- `get_global_analytics()` - Platform-wide metrics
- `calculate_org_health_score()` - Organization health
- `get_organization_details()` - Detailed org info

## 🚨 **Security Notes**

1. **Access Control**: Only specified email addresses can login
2. **Service Role**: Full database access - use with caution
3. **Activity Logging**: All admin actions are logged
4. **Session Management**: Tokens expire and require re-authentication

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **"supabaseKey is required" Error**
   - Ensure `.env.local` has correct Supabase keys
   - Restart the development server

2. **Login Failed**
   - Verify email is in authorized list
   - Check master password is correct
   - Ensure Supabase connection is active

3. **Port Already in Use**
   - Try different port: `npm run dev -- -p 3004`
   - Kill existing process: `lsof -i :3003` then `kill -9 <PID>`

## 📱 **Mobile Admin App**

A companion mobile app is also available for iOS/Android with the same functionality:
- Location: `/home/shaunkitch/WorkforceOne_New/mobile-admin/`
- Start with: `npx expo start`

## 🔄 **Next Steps**

1. **Production Deployment**
   - Deploy to Vercel/Netlify/AWS
   - Set environment variables in hosting platform
   - Configure domain and SSL

2. **Additional Security**
   - Implement 2FA authentication
   - Add IP whitelisting
   - Set up audit logging to external service

3. **Monitoring Integration**
   - Connect Vercel API for infrastructure metrics
   - Set up email alerts for critical issues
   - Configure backup automation

---

**Important**: This is a powerful administrative tool with full database access. Use responsibly and ensure proper security measures are in place before production deployment.