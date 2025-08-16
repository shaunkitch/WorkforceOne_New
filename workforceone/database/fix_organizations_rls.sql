-- Fix RLS policies for organizations table
-- This allows users to create organizations and access their own organization data

-- First, check if RLS is enabled (it should be)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'organizations';

-- Enable RLS if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read their organization" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Allow organization creation during signup" ON organizations;
DROP POLICY IF EXISTS "Users can read their organization join_code" ON organizations;

-- Policy 1: Allow authenticated users to create new organizations
CREATE POLICY "Allow organization creation" ON organizations
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Policy 2: Allow users to read their own organization
CREATE POLICY "Users can read their organization" ON organizations
    FOR SELECT TO authenticated
    USING (
        auth.uid() IN (
            SELECT p.id 
            FROM profiles p 
            WHERE p.organization_id = organizations.id
        )
    );

-- Policy 3: Allow users to update their own organization (for join_code regeneration)
CREATE POLICY "Users can update their organization" ON organizations
    FOR UPDATE TO authenticated
    USING (
        auth.uid() IN (
            SELECT p.id 
            FROM profiles p 
            WHERE p.organization_id = organizations.id 
            AND p.role IN ('admin', 'manager')
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT p.id 
            FROM profiles p 
            WHERE p.organization_id = organizations.id 
            AND p.role IN ('admin', 'manager')
        )
    );

-- Policy 4: Allow checking if join_code exists (for validation during signup)
-- This needs to be accessible to anon users during signup
CREATE POLICY "Allow join_code validation" ON organizations
    FOR SELECT TO anon, authenticated
    USING (join_code IS NOT NULL);

-- Policy 5: Allow anonymous users to create organizations during signup
CREATE POLICY "Allow anonymous organization creation" ON organizations
    FOR INSERT TO anon
    WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;
GRANT SELECT, INSERT ON organizations TO anon;
GRANT USAGE ON SEQUENCE organizations_id_seq TO authenticated, anon;

-- Verify policies are created
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'organizations';