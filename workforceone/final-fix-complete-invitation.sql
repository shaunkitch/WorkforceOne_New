-- Final fix for complete_invitation_after_auth function
-- Resolves the "column reference product_id is ambiguous" error

CREATE OR REPLACE FUNCTION complete_invitation_after_auth(
  invitation_code_param TEXT,
  user_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  guard_invitation_record RECORD;
  product_name_var TEXT;  -- Renamed to avoid column conflict
BEGIN
  -- Check product_invitations
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    -- Grant access to each product
    FOREACH product_name_var IN ARRAY invitation_record.products
    LOOP
      INSERT INTO user_products (user_id, product_id, granted_by)
      VALUES (user_id_param, product_name_var, invitation_record.created_by)
      ON CONFLICT (user_id, product_id) DO NOTHING;
    END LOOP;

    -- Mark invitation as accepted
    UPDATE product_invitations
    SET status = 'accepted', accepted_at = NOW(), accepted_by = user_id_param
    WHERE id = invitation_record.id;

    RETURN jsonb_build_object(
      'success', true,
      'products', invitation_record.products,
      'message', 'Products granted successfully'
    );
  END IF;

  -- Check guard invitations
  SELECT * INTO guard_invitation_record
  FROM security_guard_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    -- Grant guard access
    INSERT INTO user_products (user_id, product_id, granted_by)
    VALUES (user_id_param, 'guard-management', guard_invitation_record.invited_by)
    ON CONFLICT (user_id, product_id) DO NOTHING;

    -- Mark invitation as accepted
    UPDATE security_guard_invitations
    SET status = 'accepted', accepted_at = NOW(), accepted_by = user_id_param
    WHERE id = guard_invitation_record.id;

    RETURN jsonb_build_object(
      'success', true,
      'products', ARRAY['guard-management'],
      'message', 'Guard access granted successfully'
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or expired');
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_invitation_after_auth(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION complete_invitation_after_auth(TEXT, UUID) TO authenticated;

-- Test the function
SELECT complete_invitation_after_auth('GRD-H8I2KU', '123e4567-e89b-12d3-a456-426614174000'::UUID);