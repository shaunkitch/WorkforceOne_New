# WorkforceOne Rate Limiting & Auth Issues Fix

## 🚨 Current Issues
1. **429 Too Many Requests** - Supabase rate limiting
2. **401 Unauthorized** - RLS policies blocking access
3. **Profile creation failures** during signup

## 🔧 Immediate Solutions

### 1. **Wait for Rate Limit Reset**
- **Wait Time**: 15-60 minutes
- **Check**: Go to your Supabase project dashboard > Settings > Usage
- **Monitor**: Look for "API requests" usage meter

### 2. **Run Database Fixes**
Run these SQL scripts in your Supabase SQL Editor:

#### A. Fix Profiles and Organizations RLS
```sql
-- Run this first: /workforceone/database/fix_profiles_rls.sql
```

#### B. Fix Organizations Access
```sql
-- Temporary fix for organizations table access
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Or create proper policy:
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Allow authenticated users to read organizations" ON organizations
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create organizations" ON organizations  
    FOR INSERT WITH CHECK (true);
```

#### C. Fix All RLS Policies for Development
```sql
-- TEMPORARY: Disable RLS on key tables for development
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;

-- WARNING: Only use this during development!
-- Re-enable RLS in production with proper policies
```

### 3. **Update Environment Variables**
Double-check your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://edeheyeloakiworbkfpg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 4. **Test Authentication Flow**

#### A. Clear Browser Data
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Clear all LocalStorage and SessionStorage
4. Clear cookies for your domain

#### B. Test Signup Process
1. Wait for rate limit to reset
2. Use a NEW email address
3. Try signing up with minimal data first
4. Check Supabase Auth dashboard for user creation

#### C. Test Login Process  
1. Use the account you just created
2. If profile errors occur, check Settings page
3. Profile should auto-create now

## 🛠️ Code Improvements Made

### Enhanced Error Handling
- ✅ Better rate limit error messages
- ✅ Specific error handling for common issues
- ✅ User-friendly error displays

### Auth Service with Rate Limiting
- ✅ Created `AuthService` class with request throttling
- ✅ 2-second delays between auth requests
- ✅ Better error handling and recovery

### Profile Auto-Creation
- ✅ Settings page now creates missing profiles
- ✅ Signup process handles profile creation
- ✅ Better error recovery

## 🚀 Recommended Development Workflow

### During Development:
1. **Disable RLS temporarily** (as shown above)
2. **Use rate-limited requests** (built into new AuthService)
3. **Test with different email addresses**
4. **Monitor Supabase dashboard** for usage

### Before Production:
1. **Re-enable RLS** on all tables
2. **Create proper RLS policies** based on your security requirements
3. **Test thoroughly** with RLS enabled
4. **Consider upgrading** to Supabase Pro for higher limits

## 🔍 Debugging Steps

### If Still Getting 429 Errors:
1. Check Supabase project dashboard usage
2. Wait longer (up to 1 hour)
3. Consider creating a new Supabase project for testing
4. Use different IP/network if possible

### If Getting 401 Unauthorized:
1. Check that RLS is disabled or policies are correct
2. Verify environment variables are correct
3. Check browser network tab for actual error details
4. Test API calls directly in Supabase dashboard

### If Profiles Still Not Creating:
1. Check that the trigger function exists and works
2. Manually insert a profile in the database
3. Check browser console for detailed error messages
4. Verify the profiles table structure matches the code

## 📞 Support Options

If issues persist:
1. **Supabase Support**: Contact via their dashboard
2. **Rate Limit Increase**: Request through Supabase support
3. **Pro Plan**: Consider upgrading for development
4. **Alternative**: Create a new Supabase project as backup

Remember: Rate limiting is a temporary issue that resolves with time. The code improvements will help prevent future rate limiting issues.