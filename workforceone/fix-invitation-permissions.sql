-- Fix invitation system permissions and RLS policies
-- This resolves the 401/406 errors we're seeing in the logs

-- 1. First, let's make sure the tables exist and have proper permissions
-- Grant permissions to authenticated and anon users
GRANT SELECT, INSERT, UPDATE ON product_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON product_invitations TO anon;
GRANT SELECT, INSERT, UPDATE ON user_products TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_products TO anon;
GRANT SELECT ON security_guard_invitations TO authenticated;
GRANT SELECT ON security_guard_invitations TO anon;

-- 2. Update RLS policies for product_invitations
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invitations for their email" ON product_invitations;
DROP POLICY IF EXISTS "Authenticated users can create invitations" ON product_invitations;
DROP POLICY IF EXISTS "Anyone can read pending invitations by code" ON product_invitations;

-- Create new, more permissive policies
CREATE POLICY "Anyone can read invitations by code" ON product_invitations
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create invitations" ON product_invitations
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their invitations" ON product_invitations
  FOR UPDATE 
  TO authenticated
  USING (true);

-- 3. Update RLS policies for user_products
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own products" ON user_products;
DROP POLICY IF EXISTS "Users can insert their own products" ON user_products;

-- Create new policies
CREATE POLICY "Anyone can read user products" ON user_products
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert user products" ON user_products
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update user products" ON user_products
  FOR UPDATE 
  USING (true);

-- 4. Update RLS policies for security_guard_invitations
-- Drop existing policies
DROP POLICY IF EXISTS "security_guard_invitations_anon_select_by_code" ON security_guard_invitations;
DROP POLICY IF EXISTS "security_guard_invitations_auth_insert" ON security_guard_invitations;
DROP POLICY IF EXISTS "security_guard_invitations_auth_select" ON security_guard_invitations;
DROP POLICY IF EXISTS "security_guard_invitations_auth_update" ON security_guard_invitations;

-- Create new policies
CREATE POLICY "Anyone can read guard invitations" ON security_guard_invitations
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create guard invitations" ON security_guard_invitations
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update guard invitations" ON security_guard_invitations
  FOR UPDATE 
  TO authenticated
  USING (true);

-- 5. Ensure functions have proper permissions
-- Grant execute permissions on invitation functions
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invitation_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_invitation_code(TEXT) TO authenticated;

-- 6. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Test data - Create a test invitation that can be scanned
DO $$
DECLARE
    test_code TEXT;
    test_org_id UUID;
BEGIN
    -- Generate a test invitation code
    test_code := 'TEST-' || upper(substring(md5(random()::text) from 1 for 6));
    
    -- Try to get a valid organization ID (or create a placeholder)
    SELECT id INTO test_org_id FROM organizations LIMIT 1;
    
    IF test_org_id IS NULL THEN
        -- Create a test organization if none exists
        INSERT INTO organizations (name, join_code) 
        VALUES ('Test Organization', 'TESTORG') 
        RETURNING id INTO test_org_id;
    END IF;
    
    -- Insert test invitation
    INSERT INTO product_invitations (
        invitation_code,
        products,
        organization_id,
        status,
        expires_at
    ) VALUES (
        test_code,
        ARRAY['workforce-management', 'guard-management'],
        test_org_id,
        'pending',
        NOW() + INTERVAL '7 days'
    );
    
    -- Insert test guard invitation
    INSERT INTO security_guard_invitations (
        invitation_code,
        organization_id,
        email,
        status,
        expires_at
    ) VALUES (
        'GRD-' || upper(substring(md5(random()::text) from 1 for 6)),
        test_org_id,
        'test@example.com',
        'pending',
        NOW() + INTERVAL '7 days'
    );
    
    RAISE NOTICE 'Test invitations created successfully!';
    RAISE NOTICE 'Product invitation code: %', test_code;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create test data: %', SQLERRM;
END
$$;

-- 8. Verify the setup
SELECT 
    'product_invitations' as table_name,
    count(*) as record_count,
    array_agg(invitation_code) as codes
FROM product_invitations 
WHERE status = 'pending'
UNION ALL
SELECT 
    'security_guard_invitations' as table_name,
    count(*) as record_count,
    array_agg(invitation_code) as codes
FROM security_guard_invitations 
WHERE status = 'pending';