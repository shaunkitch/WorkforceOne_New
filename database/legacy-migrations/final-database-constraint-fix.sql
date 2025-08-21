-- Final fix for the database constraint issue in complete_invitation_after_auth
-- This replaces ON CONFLICT with explicit IF/ELSE logic to avoid constraint errors

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
  product_name_var TEXT;
  existing_access RECORD;
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
      -- Check if access already exists
      SELECT * INTO existing_access 
      FROM user_products 
      WHERE user_id = user_id_param AND product_id = product_name_var;
      
      IF NOT FOUND THEN
        -- Insert new access
        INSERT INTO user_products (user_id, product_id, granted_by, granted_at, is_active)
        VALUES (user_id_param, product_name_var, invitation_record.created_by, NOW(), true);
      ELSE
        -- Update existing access
        UPDATE user_products 
        SET granted_by = invitation_record.created_by,
            granted_at = NOW(),
            is_active = true
        WHERE user_id = user_id_param AND product_id = product_name_var;
      END IF;
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
    -- Check if guard access already exists
    SELECT * INTO existing_access 
    FROM user_products 
    WHERE user_id = user_id_param AND product_id = 'guard-management';
    
    IF NOT FOUND THEN
      -- Insert new guard access
      INSERT INTO user_products (user_id, product_id, granted_by, granted_at, is_active)
      VALUES (user_id_param, 'guard-management', guard_invitation_record.invited_by, NOW(), true);
    ELSE
      -- Update existing guard access
      UPDATE user_products 
      SET granted_by = guard_invitation_record.invited_by,
          granted_at = NOW(),
          is_active = true
      WHERE user_id = user_id_param AND product_id = 'guard-management';
    END IF;

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
SELECT complete_invitation_after_auth('GRD-H8I2KU', '123e4567-e89b-12d3-a456-426614174000'::UUID) as test_result;