-- TEMPORARILY DISABLE RLS FOR TESTING
-- This will confirm that RLS is the root cause of the 406/401 errors

-- Disable RLS on organizations table (temporarily)
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles table (temporarily)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test message
SELECT 'RLS DISABLED - Test signup now. Both 406 and 401 errors should be gone.' as status;