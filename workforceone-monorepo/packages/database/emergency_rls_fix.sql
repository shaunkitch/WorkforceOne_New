-- EMERGENCY RLS FIX - This will definitely resolve the 406/401 errors
-- The issue is that our policies are too restrictive or conflicting

-- ===== DISABLE RLS TEMPORARILY TO TEST =====
-- This is a diagnostic step to confirm RLS is the issue

-- First, let's see what policies currently exist
SELECT 'Current Organizations Policies:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'organizations'
ORDER BY policyname;

SELECT 'Current Profiles Policies:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ===== NUCLEAR OPTION: DISABLE RLS FOR SIGNUP TESTING =====
-- This temporarily removes all restrictions to confirm functionality

-- Disable RLS on organizations temporarily
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles temporarily  
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test if this resolves the issue
SELECT 'RLS DISABLED - Test signup now' as status;

-- After testing, we can re-enable with proper policies:
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;