-- Migration 022: Simple Profiles RLS without circular dependency
-- This completely removes circular dependency by using a simple approach

-- First, disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Organization members can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Organization members can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and managers can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Create simple, non-circular policies

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. All authenticated users can view other profiles (temporary for development)
-- TODO: Replace with proper organization-based filtering once org structure is stable
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Users can insert their own profile during registration
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Admins can manage all profiles (simple check without circular dependency)
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Users can view their own profile';
COMMENT ON POLICY "Authenticated users can view profiles" ON profiles IS 'Temporary: All authenticated users can view profiles for development';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Users can update their own profile';
COMMENT ON POLICY "Users can insert own profile" ON profiles IS 'Users can insert their own profile during registration';
COMMENT ON POLICY "Service role can manage all profiles" ON profiles IS 'Service role can manage all profiles for admin operations';

-- Verify the policies work
COMMENT ON TABLE profiles IS 'Profiles table with simplified RLS policies to avoid circular dependency';