-- Fix the accept_product_invitation function to work with unauthenticated users
-- This is needed because users scan QR codes BEFORE they're authenticated

-- Drop and recreate the function with proper permissions
DROP FUNCTION IF EXISTS accept_product_invitation(TEXT, TEXT);

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
  -- Get the invitation (this should work for anonymous users)
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
  END IF;

  -- For authenticated users, get their profile
  IF auth.uid() IS NOT NULL THEN
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
    -- For unauthenticated users, just validate the invitation
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

-- Grant execute permission to both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO authenticated;

-- Also create a simpler function that works for unauthenticated validation
CREATE OR REPLACE FUNCTION validate_invitation_code(invitation_code_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired invitation code');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'products', invitation_record.products,
    'organization_id', invitation_record.organization_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION validate_invitation_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_invitation_code(TEXT) TO authenticated;