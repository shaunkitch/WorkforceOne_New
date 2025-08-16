-- FINAL WORKING RLS POLICIES
-- Now that we've confirmed RLS was the issue, create minimal working policies

-- ===== ORGANIZATIONS TABLE =====

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Clear ALL existing policies to start fresh
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON organizations';
    END LOOP;
END $$;

-- Create minimal working policies for organizations
-- 1. Allow anonymous users to read organizations (for join code validation)
CREATE POLICY "organizations_anon_select" ON organizations
    FOR SELECT TO anon 
    USING (true);

-- 2. Allow anonymous users to insert organizations (for signup)
CREATE POLICY "organizations_anon_insert" ON organizations
    FOR INSERT TO anon 
    WITH CHECK (true);

-- 3. Allow authenticated users to read their own organization
CREATE POLICY "organizations_auth_select" ON organizations
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- 4. Allow authenticated admins to update their organization
CREATE POLICY "organizations_auth_update" ON organizations
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

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Clear ALL existing policies to start fresh
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Create minimal working policies for profiles
-- 1. Allow authenticated users to insert their own profile
CREATE POLICY "profiles_auth_insert" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- 2. Allow authenticated users to select their own profile
CREATE POLICY "profiles_auth_select_own" ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- 3. Allow authenticated users to update their own profile
CREATE POLICY "profiles_auth_update_own" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 4. Allow authenticated users to read profiles in their organization
CREATE POLICY "profiles_auth_select_org" ON profiles
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- ===== GRANT PERMISSIONS =====

-- Grant table-level permissions
GRANT SELECT, INSERT ON organizations TO anon;
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- ===== VERIFICATION =====

-- Show policy counts
SELECT 
    'organizations' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'organizations'

UNION ALL

SELECT 
    'profiles' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';

-- Success message
SELECT 'RLS policies applied successfully! Test signup now.' as status;