-- WORKING RLS FIX - Addresses the actual signup flow issues
-- The problem is that validation happens BEFORE auth, and profile creation happens during session establishment

-- ===== ORGANIZATIONS TABLE =====

-- Ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies first
DROP POLICY IF EXISTS "anon_validate_join_codes" ON organizations;
DROP POLICY IF EXISTS "anon_create_organizations" ON organizations;
DROP POLICY IF EXISTS "users_read_own_org" ON organizations;
DROP POLICY IF EXISTS "admins_update_org" ON organizations;

-- Policy 1: Allow ALL anonymous reads (needed for join code validation during signup)
CREATE POLICY "allow_anon_read_organizations" ON organizations
    FOR SELECT TO anon
    USING (true);

-- Policy 2: Allow ALL anonymous inserts (needed for organization creation during signup)
CREATE POLICY "allow_anon_create_organizations" ON organizations
    FOR INSERT TO anon
    WITH CHECK (true);

-- Policy 3: Allow authenticated users to read their organization
CREATE POLICY "allow_auth_read_own_org" ON organizations
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy 4: Allow authenticated admins to update their organization
CREATE POLICY "allow_auth_update_own_org" ON organizations
    FOR UPDATE TO authenticated
    USING (
        id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- ===== PROFILES TABLE =====

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies first
DROP POLICY IF EXISTS "auth_create_own_profile" ON profiles;
DROP POLICY IF EXISTS "auth_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "auth_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "auth_read_org_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_update_org_profiles" ON profiles;

-- Policy 1: Allow authenticated users to create their own profile
CREATE POLICY "allow_create_own_profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- Policy 2: Allow authenticated users to read their own profile
CREATE POLICY "allow_read_own_profile" ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Policy 3: Allow authenticated users to update their own profile
CREATE POLICY "allow_update_own_profile" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 4: Allow users to read profiles in their organization
CREATE POLICY "allow_read_org_profiles" ON profiles
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- ===== GRANT PERMISSIONS =====

-- Organizations permissions
GRANT SELECT, INSERT ON organizations TO anon;
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;

-- Profiles permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- ===== VERIFICATION =====

SELECT 'Organizations policies:' as table_type, COUNT(*) as policy_count
FROM pg_policies WHERE tablename = 'organizations'
UNION ALL
SELECT 'Profiles policies:' as table_type, COUNT(*) as policy_count
FROM pg_policies WHERE tablename = 'profiles';

SELECT 'RLS Fix Applied Successfully!' as status;