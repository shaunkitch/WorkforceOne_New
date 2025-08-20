-- Create missing invitation functions
-- This fixes the "function does not exist" error

-- 1. Create validate_invitation_code function
CREATE OR REPLACE FUNCTION validate_invitation_code(invitation_code_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
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
  SELECT * INTO invitation_record
  FROM security_guard_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    RETURN jsonb_build_object(
      'valid', true,
      'type', 'guard_invitation',
      'products', ARRAY['guard-management'],
      'organization_id', invitation_record.organization_id
    );
  END IF;

  -- No valid invitation found
  RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired invitation code');
END;
$$;

-- 2. Create or update accept_product_invitation function
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
  user_profile RECORD;
  product_id TEXT;
  result JSONB;
BEGIN
  -- Get the invitation from product_invitations
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    -- Try security_guard_invitations
    SELECT * INTO invitation_record
    FROM security_guard_invitations
    WHERE invitation_code = invitation_code_param
      AND status = 'pending'
      AND expires_at > NOW();
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
    ELSE
      -- Handle guard invitation
      IF auth.uid() IS NOT NULL THEN
        SELECT * INTO user_profile
        FROM profiles
        WHERE id = auth.uid();

        IF NOT FOUND THEN
          RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
        END IF;

        -- Grant guard management access
        INSERT INTO user_products (user_id, product_id, granted_by)
        VALUES (user_profile.id, 'guard-management', invitation_record.invited_by)
        ON CONFLICT (user_id, product_id) DO NOTHING;

        -- Mark guard invitation as accepted
        UPDATE security_guard_invitations
        SET status = 'accepted',
            accepted_at = NOW(),
            accepted_by = user_profile.id
        WHERE id = invitation_record.id;

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
          'organization_id', invitation_record.organization_id
        );
      END IF;
    END IF;
  END IF;

  -- Handle product invitation
  IF auth.uid() IS NOT NULL THEN
    -- Authenticated user
    SELECT * INTO user_profile
    FROM profiles
    WHERE id = auth.uid();

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    -- Grant access to each product in the invitation
    FOREACH product_id IN ARRAY invitation_record.products
    LOOP
      INSERT INTO user_products (user_id, product_id, granted_by)
      VALUES (user_profile.id, product_id, invitation_record.created_by)
      ON CONFLICT (user_id, product_id) DO NOTHING;
    END LOOP;

    -- Mark invitation as accepted
    UPDATE product_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = user_profile.id
    WHERE id = invitation_record.id;

    RETURN jsonb_build_object(
      'success', true,
      'products', invitation_record.products,
      'message', 'Successfully joined ' || array_to_string(invitation_record.products, ', '),
      'requires_signup', false
    );
  ELSE
    -- Unauthenticated user - just validate
    RETURN jsonb_build_object(
      'success', true,
      'products', invitation_record.products,
      'message', 'Invitation is valid. Please sign up to complete.',
      'requires_signup', true,
      'organization_id', invitation_record.organization_id
    );
  END IF;
END;
$$;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_invitation_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_invitation_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO authenticated;

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload schema';