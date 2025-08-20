-- Enhanced invitation functions with automatic user creation and sign-in
-- This allows QR code scanning to automatically sign users in

-- 1. Create or update accept_product_invitation with auto user creation
CREATE OR REPLACE FUNCTION accept_product_invitation_with_signup(
  invitation_code_param TEXT,
  user_email_param TEXT,
  user_name_param TEXT DEFAULT NULL,
  auto_create_user BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  guard_invitation_record RECORD;
  user_profile RECORD;
  new_user_id UUID;
  product_id TEXT;
  temp_password TEXT;
BEGIN
  -- Generate a temporary password for auto-created users
  temp_password := 'temp_' || substring(md5(random()::text) from 1 for 8);
  
  -- First check product_invitations
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    -- Handle product invitation
    IF auth.uid() IS NOT NULL THEN
      -- User is already authenticated
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
        'requires_signup', false,
        'user_created', false
      );
    ELSE
      -- User not authenticated - create account if auto_create_user is true
      IF auto_create_user AND user_email_param IS NOT NULL AND user_email_param != '' THEN
        -- Create user in auth.users table (this is a simplified approach)
        -- In production, you'd want to use Supabase Auth API
        
        -- Check if user already exists
        SELECT id INTO new_user_id FROM auth.users WHERE email = user_email_param;
        
        IF new_user_id IS NULL THEN
          -- For now, return signup info - actual user creation needs to happen via Supabase Auth
          RETURN jsonb_build_object(
            'success', true,
            'products', invitation_record.products,
            'message', 'Invitation valid. Creating account...',
            'requires_signup', true,
            'auto_signup', true,
            'email', user_email_param,
            'name', user_name_param,
            'organization_id', invitation_record.organization_id,
            'invitation_code', invitation_code_param
          );
        ELSE
          -- User exists, create profile if needed
          INSERT INTO profiles (id, email, full_name, organization_id)
          VALUES (new_user_id, user_email_param, user_name_param, invitation_record.organization_id)
          ON CONFLICT (id) DO UPDATE SET
            organization_id = COALESCE(profiles.organization_id, invitation_record.organization_id);
          
          -- Grant product access
          FOREACH product_id IN ARRAY invitation_record.products
          LOOP
            INSERT INTO user_products (user_id, product_id, granted_by)
            VALUES (new_user_id, product_id, invitation_record.created_by)
            ON CONFLICT (user_id, product_id) DO NOTHING;
          END LOOP;

          -- Mark invitation as accepted
          UPDATE product_invitations
          SET status = 'accepted', accepted_at = NOW(), accepted_by = new_user_id
          WHERE id = invitation_record.id;

          RETURN jsonb_build_object(
            'success', true,
            'products', invitation_record.products,
            'message', 'Account linked successfully',
            'requires_signup', false,
            'user_created', false
          );
        END IF;
      ELSE
        -- No auto-creation, return signup required
        RETURN jsonb_build_object(
          'success', true,
          'products', invitation_record.products,
          'message', 'Invitation is valid. Please sign up to complete.',
          'requires_signup', true,
          'organization_id', invitation_record.organization_id,
          'invitation_code', invitation_code_param
        );
      END IF;
    END IF;
  END IF;

  -- Check security_guard_invitations
  SELECT * INTO guard_invitation_record
  FROM security_guard_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    -- Handle guard invitation with auto-signup
    IF auth.uid() IS NOT NULL THEN
      -- User already authenticated
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
        'requires_signup', false,
        'user_created', false
      );
    ELSE
      -- Auto-create guard user
      IF auto_create_user THEN
        RETURN jsonb_build_object(
          'success', true,
          'products', ARRAY['guard-management'],
          'message', 'Guard invitation valid. Creating account...',
          'requires_signup', true,
          'auto_signup', true,
          'email', COALESCE(user_email_param, guard_invitation_record.email),
          'name', user_name_param,
          'organization_id', guard_invitation_record.organization_id,
          'invitation_code', invitation_code_param,
          'guard_invitation', true
        );
      ELSE
        RETURN jsonb_build_object(
          'success', true,
          'products', ARRAY['guard-management'],
          'message', 'Guard invitation is valid. Please sign up to complete.',
          'requires_signup', true,
          'organization_id', guard_invitation_record.organization_id,
          'invitation_code', invitation_code_param
        );
      END IF;
    END IF;
  END IF;

  -- No valid invitation found
  RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
END;
$$;

-- 2. Grant permissions for the new function
GRANT EXECUTE ON FUNCTION accept_product_invitation_with_signup(TEXT, TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION accept_product_invitation_with_signup(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- 3. Create a function to complete invitation after successful auth
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
  product_id TEXT;
BEGIN
  -- Check product_invitations
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF FOUND THEN
    -- Grant access to each product
    FOREACH product_id IN ARRAY invitation_record.products
    LOOP
      INSERT INTO user_products (user_id, product_id, granted_by)
      VALUES (user_id_param, product_id, invitation_record.created_by)
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