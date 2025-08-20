-- Complete fix for guard invitation system
-- This resolves all 406 errors and missing invitation issues

-- 1. Fix RLS policies for security_guard_invitations
ALTER TABLE security_guard_invitations ENABLE ROW LEVEL SECURITY;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "security_guard_invitations_anon_select_by_code" ON security_guard_invitations;
DROP POLICY IF EXISTS "security_guard_invitations_auth_insert" ON security_guard_invitations;
DROP POLICY IF EXISTS "security_guard_invitations_auth_select" ON security_guard_invitations;
DROP POLICY IF EXISTS "security_guard_invitations_auth_update" ON security_guard_invitations;
DROP POLICY IF EXISTS "Anyone can read guard invitations" ON security_guard_invitations;
DROP POLICY IF EXISTS "Authenticated users can create guard invitations" ON security_guard_invitations;
DROP POLICY IF EXISTS "Authenticated users can update guard invitations" ON security_guard_invitations;

-- Create new, working policies
CREATE POLICY "allow_anon_read_guard_invitations" ON security_guard_invitations
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "allow_auth_read_guard_invitations" ON security_guard_invitations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "allow_auth_insert_guard_invitations" ON security_guard_invitations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_auth_update_guard_invitations" ON security_guard_invitations
  FOR UPDATE TO authenticated
  USING (true);

-- 2. Grant explicit table permissions
GRANT SELECT ON security_guard_invitations TO anon;
GRANT SELECT, INSERT, UPDATE ON security_guard_invitations TO authenticated;

-- 3. Update the accept_product_invitation function to handle guard invitations properly
CREATE OR REPLACE FUNCTION accept_product_invitation(
  invitation_code_param TEXT,
  user_email_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  guard_invitation_record RECORD;
  user_profile RECORD;
  product_id TEXT;
BEGIN
  -- First check product_invitations
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    -- Handle product invitation
    IF auth.uid() IS NOT NULL THEN
      SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
      
      IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
      END IF;

      -- Grant access to each product
      FOREACH product_id IN ARRAY invitation_record.products
      LOOP
        INSERT INTO user_products (user_id, product_id, granted_by)
        VALUES (user_profile.id, product_id, invitation_record.created_by)
        ON CONFLICT (user_id, product_id) DO NOTHING;
      END LOOP;

      -- Mark invitation as accepted
      UPDATE product_invitations
      SET status = 'accepted', accepted_at = NOW(), accepted_by = user_profile.id
      WHERE id = invitation_record.id;

      RETURN jsonb_build_object(
        'success', true,
        'products', invitation_record.products,
        'message', 'Successfully joined ' || array_to_string(invitation_record.products, ', '),
        'requires_signup', false
      );
    ELSE
      -- Unauthenticated user
      RETURN jsonb_build_object(
        'success', true,
        'products', invitation_record.products,
        'message', 'Invitation is valid. Please sign up to complete.',
        'requires_signup', true,
        'organization_id', invitation_record.organization_id
      );
    END IF;
  END IF;

  -- Check security_guard_invitations
  SELECT * INTO guard_invitation_record
  FROM security_guard_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    -- Handle guard invitation
    IF auth.uid() IS NOT NULL THEN
      SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
      
      IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
      END IF;

      -- Grant guard management access
      INSERT INTO user_products (user_id, product_id, granted_by)
      VALUES (user_profile.id, 'guard-management', guard_invitation_record.invited_by)
      ON CONFLICT (user_id, product_id) DO NOTHING;

      -- Mark guard invitation as accepted
      UPDATE security_guard_invitations
      SET status = 'accepted', accepted_at = NOW(), accepted_by = user_profile.id
      WHERE id = guard_invitation_record.id;

      RETURN jsonb_build_object(
        'success', true,
        'products', ARRAY['guard-management'],
        'message', 'Successfully joined as security guard',
        'requires_signup', false
      );
    ELSE
      -- Unauthenticated user
      RETURN jsonb_build_object(
        'success', true,
        'products', ARRAY['guard-management'],
        'message', 'Guard invitation is valid. Please sign up to complete.',
        'requires_signup', true,
        'organization_id', guard_invitation_record.organization_id
      );
    END IF;
  END IF;

  -- No valid invitation found
  RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
END;
$$;

-- 4. Update validate_invitation_code function
CREATE OR REPLACE FUNCTION validate_invitation_code(invitation_code_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  guard_invitation_record RECORD;
BEGIN
  -- Check product_invitations first
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    RETURN jsonb_build_object(
      'valid', true,
      'type', 'product_invitation',
      'products', invitation_record.products,
      'organization_id', invitation_record.organization_id
    );
  END IF;

  -- Check security_guard_invitations
  SELECT * INTO guard_invitation_record
  FROM security_guard_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    RETURN jsonb_build_object(
      'valid', true,
      'type', 'guard_invitation',
      'products', ARRAY['guard-management'],
      'organization_id', guard_invitation_record.organization_id
    );
  END IF;

  -- No valid invitation found
  RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired invitation code');
END;
$$;

-- 5. Grant function permissions
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invitation_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_invitation_code(TEXT) TO authenticated;

-- 6. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Verify the fix works
SELECT 'Testing guard invitation access...' as status;

SELECT 
  invitation_code,
  status,
  expires_at > NOW() as is_valid,
  email
FROM security_guard_invitations 
WHERE invitation_code = 'GRD-H8I2KU';

SELECT 'Guard invitation fix completed!' as status;