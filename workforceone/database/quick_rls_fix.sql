-- Quick RLS fix for organization creation and join code validation
-- Run this to immediately fix the signup issues

-- Allow anonymous users to read join_code for validation
CREATE POLICY IF NOT EXISTS "anon_read_join_codes" ON organizations
    FOR SELECT TO anon 
    USING (join_code IS NOT NULL);

-- Allow anonymous users to create organizations during signup
CREATE POLICY IF NOT EXISTS "anon_create_orgs" ON organizations
    FOR INSERT TO anon 
    WITH CHECK (true);

-- Allow authenticated users to read their own organization
CREATE POLICY IF NOT EXISTS "auth_read_own_org" ON organizations
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Allow authenticated admins to update their organization (for join codes)
CREATE POLICY IF NOT EXISTS "auth_update_own_org" ON organizations
    FOR UPDATE TO authenticated
    USING (
        id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Grant the necessary table permissions
GRANT SELECT, INSERT ON organizations TO anon;
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;

-- Grant sequence permissions (only if sequences exist)
DO $$
BEGIN
    -- Check if organizations_id_seq exists before granting
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'organizations_id_seq') THEN
        GRANT USAGE ON SEQUENCE organizations_id_seq TO anon, authenticated;
    END IF;
    
    -- Grant on all sequences as fallback
    EXECUTE 'GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated';
EXCEPTION
    WHEN insufficient_privilege THEN
        -- Ignore if we don't have permission to grant on all sequences
        NULL;
END $$;

-- Test query to verify policies work
-- SELECT 'Policies created successfully' as status;