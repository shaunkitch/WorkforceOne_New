-- Final RLS fix for organization signup issues
-- This fixes the immediate 401/406 errors by dropping and recreating policies

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "anon_validate_join_codes" ON organizations;
DROP POLICY IF EXISTS "anon_create_organizations" ON organizations;
DROP POLICY IF EXISTS "users_read_own_org" ON organizations;
DROP POLICY IF EXISTS "admins_update_org" ON organizations;

-- Drop any other existing policies that might conflict
DROP POLICY IF EXISTS "Users can read their organization" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Allow organization creation during signup" ON organizations;
DROP POLICY IF EXISTS "Users can read their organization join_code" ON organizations;

-- 1. Allow anonymous users to read join_code for validation during signup
CREATE POLICY "anon_validate_join_codes" ON organizations
    FOR SELECT TO anon 
    USING (join_code IS NOT NULL);

-- 2. Allow anonymous users to create organizations during signup
CREATE POLICY "anon_create_organizations" ON organizations
    FOR INSERT TO anon 
    WITH CHECK (true);

-- 3. Allow authenticated users to read their own organization
CREATE POLICY "users_read_own_org" ON organizations
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- 4. Allow authenticated admins to update their organization
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

-- 5. Grant basic table permissions
GRANT SELECT, INSERT ON organizations TO anon;
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;

-- Verify policies were created
SELECT 
    'RLS policies applied successfully!' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'organizations';