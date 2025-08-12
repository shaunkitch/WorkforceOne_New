-- Fix Email Confirmation Issues
-- This script helps resolve "Email not confirmed" authentication errors

-- 1. Check current user confirmation status
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Manually confirm all users (for development only)
-- UNCOMMENT THE LINES BELOW IF YOU WANT TO MANUALLY CONFIRM ALL USERS
-- WARNING: Only use in development environment

-- UPDATE auth.users 
-- SET 
--     email_confirmed_at = NOW(),
--     confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- 3. Check if users have profiles
SELECT 
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.organization_id,
    o.name as org_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.organizations o ON p.organization_id = o.id
ORDER BY u.created_at DESC;

-- 4. For specific user confirmation (replace with actual email)
-- UPDATE auth.users 
-- SET 
--     email_confirmed_at = NOW(),
--     confirmed_at = NOW()
-- WHERE email = 'your-email@example.com';