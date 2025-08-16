-- Complete RLS fix for organizations and profiles tables
-- This fixes all signup-related RLS issues

-- ===== ORGANIZATIONS TABLE =====

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing organization policies
DROP POLICY IF EXISTS "anon_validate_join_codes" ON organizations;
DROP POLICY IF EXISTS "anon_create_organizations" ON organizations;
DROP POLICY IF EXISTS "users_read_own_org" ON organizations;
DROP POLICY IF EXISTS "admins_update_org" ON organizations;
DROP POLICY IF EXISTS "Users can read their organization" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Allow organization creation during signup" ON organizations;
DROP POLICY IF EXISTS "Users can read their organization join_code" ON organizations;

-- Organizations policies
CREATE POLICY "anon_validate_join_codes" ON organizations
    FOR SELECT TO anon 
    USING (join_code IS NOT NULL);

CREATE POLICY "anon_create_organizations" ON organizations
    FOR INSERT TO anon 
    WITH CHECK (true);

CREATE POLICY "users_read_own_org" ON organizations
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "admins_update_org" ON organizations
    FOR UPDATE TO authenticated
    USING (
        id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Grant permissions for organizations
GRANT SELECT, INSERT ON organizations TO anon;
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;

-- ===== PROFILES TABLE =====

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "anon_create_profiles" ON profiles;
DROP POLICY IF EXISTS "auth_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "auth_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "auth_read_org_profiles" ON profiles;

-- Profiles policies
-- 1. Allow authenticated users to create their own profile during signup
CREATE POLICY "auth_create_own_profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- 2. Allow users to read their own profile
CREATE POLICY "auth_read_own_profile" ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- 3. Allow users to update their own profile
CREATE POLICY "auth_update_own_profile" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 4. Allow users to read profiles in their organization (for teams, etc.)
CREATE POLICY "auth_read_org_profiles" ON profiles
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- 5. Allow admins to update profiles in their organization
CREATE POLICY "admins_update_org_profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Grant permissions for profiles
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- ===== VERIFICATION =====

-- Show created policies
SELECT 
    'Organizations policies:' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'organizations'

UNION ALL

SELECT 
    'Profiles policies:' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';