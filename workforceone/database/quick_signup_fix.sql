-- Quick fix for signup flow RLS issues
-- This fixes the 406 and 401 errors during signup

-- ===== FIX ORGANIZATIONS TABLE =====

-- Ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the anonymous validation policy
DROP POLICY IF EXISTS "anon_validate_join_codes" ON organizations;

-- Allow anonymous users to check if join codes exist (for validation)
CREATE POLICY "anon_validate_join_codes" ON organizations
    FOR SELECT TO anon 
    USING (true);  -- Allow all reads for anon users

-- Ensure anon can create organizations
DROP POLICY IF EXISTS "anon_create_organizations" ON organizations;
CREATE POLICY "anon_create_organizations" ON organizations
    FOR INSERT TO anon 
    WITH CHECK (true);

-- ===== FIX PROFILES TABLE =====

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create their own profile
-- (This should already exist but let's ensure it's correct)
DROP POLICY IF EXISTS "auth_create_own_profile" ON profiles;
CREATE POLICY "auth_create_own_profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- Allow authenticated users to read their own profile
DROP POLICY IF EXISTS "auth_read_own_profile" ON profiles;
CREATE POLICY "auth_read_own_profile" ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Verify policies exist
SELECT 
    'Fixed policies count:' as status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'organizations') as org_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as profile_policies;