-- =============================================
-- SUBSCRIPTION MANAGEMENT FUNCTIONS
-- =============================================

-- Function to create or update a subscription with selected features
CREATE OR REPLACE FUNCTION update_subscription(
  org_id UUID,
  user_count INTEGER,
  billing_period billing_period,
  feature_keys TEXT[]
)
RETURNS JSONB AS $$
DECLARE
  sub_id UUID;
  feature_rec RECORD;
  result JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND organization_id = org_id 
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can update subscriptions';
  END IF;

  -- Get or create subscription
  INSERT INTO subscriptions (
    organization_id,
    status,
    billing_period,
    user_count,
    user_tier_price
  )
  VALUES (
    org_id,
    'trial', -- Default to trial for new subscriptions
    billing_period,
    user_count,
    CASE 
      WHEN user_count <= 10 THEN 0
      WHEN user_count <= 50 THEN 2
      WHEN user_count <= 200 THEN 4
      ELSE 6
    END
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    billing_period = EXCLUDED.billing_period,
    user_count = EXCLUDED.user_count,
    user_tier_price = EXCLUDED.user_tier_price,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO sub_id;

  -- Clear existing non-free features
  DELETE FROM subscription_features sf
  USING features f
  WHERE sf.subscription_id = sub_id 
    AND sf.feature_id = f.id
    AND f.is_free = false;

  -- Add selected features
  FOR feature_rec IN 
    SELECT id FROM features 
    WHERE feature_key = ANY(feature_keys)
      AND is_free = false
  LOOP
    INSERT INTO subscription_features (
      subscription_id,
      feature_id,
      enabled
    )
    VALUES (
      sub_id,
      feature_rec.id,
      true
    )
    ON CONFLICT (subscription_id, feature_id) DO UPDATE SET
      enabled = true;
  END LOOP;

  -- Calculate and update total
  UPDATE subscriptions
  SET monthly_total = calculate_subscription_total(sub_id)
  WHERE id = sub_id;

  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'subscription_id', sub_id,
    'monthly_total', monthly_total
  ) INTO result
  FROM subscriptions
  WHERE id = sub_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start a subscription after trial
CREATE OR REPLACE FUNCTION activate_subscription(
  org_id UUID,
  payment_method_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
  sub_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND organization_id = org_id 
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can activate subscriptions';
  END IF;

  -- Update subscription status
  UPDATE subscriptions
  SET 
    status = 'active',
    payment_method_id = payment_method_id_param,
    current_period_start = CURRENT_TIMESTAMP,
    current_period_end = CURRENT_TIMESTAMP + 
      CASE 
        WHEN billing_period = 'yearly' THEN INTERVAL '1 year'
        ELSE INTERVAL '1 month'
      END,
    updated_at = CURRENT_TIMESTAMP
  WHERE organization_id = org_id
  RETURNING id INTO sub_id;

  IF sub_id IS NULL THEN
    RAISE EXCEPTION 'No subscription found for organization';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', sub_id,
    'message', 'Subscription activated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
  org_id UUID,
  immediate BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  sub_id UUID;
  end_date TIMESTAMPTZ;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND organization_id = org_id 
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can cancel subscriptions';
  END IF;

  -- Get subscription
  SELECT id, current_period_end 
  INTO sub_id, end_date
  FROM subscriptions
  WHERE organization_id = org_id;

  IF sub_id IS NULL THEN
    RAISE EXCEPTION 'No subscription found for organization';
  END IF;

  -- Cancel subscription
  UPDATE subscriptions
  SET 
    status = CASE 
      WHEN immediate THEN 'canceled'
      ELSE status -- Keep current status until period ends
    END,
    canceled_at = CURRENT_TIMESTAMP,
    current_period_end = CASE
      WHEN immediate THEN CURRENT_TIMESTAMP
      ELSE current_period_end
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', sub_id,
    'cancellation_date', CASE 
      WHEN immediate THEN CURRENT_TIMESTAMP 
      ELSE end_date 
    END,
    'immediate', immediate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and apply promo code
CREATE OR REPLACE FUNCTION apply_promo_code(
  org_id UUID,
  code_param VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  promo_id UUID;
  discount_info JSONB;
  sub_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND organization_id = org_id 
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can apply promo codes';
  END IF;

  -- Get subscription
  SELECT id INTO sub_id
  FROM subscriptions
  WHERE organization_id = org_id;

  IF sub_id IS NULL THEN
    RAISE EXCEPTION 'No subscription found for organization';
  END IF;

  -- Check promo code validity
  SELECT 
    id,
    jsonb_build_object(
      'discount_type', discount_type,
      'discount_value', discount_value,
      'description', description
    )
  INTO promo_id, discount_info
  FROM promo_codes
  WHERE code = code_param
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF promo_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired promo code'
    );
  END IF;

  -- Check if already applied
  IF EXISTS (
    SELECT 1 FROM applied_promos
    WHERE subscription_id = sub_id
      AND promo_code_id = promo_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Promo code already applied'
    );
  END IF;

  -- Apply promo code
  INSERT INTO applied_promos (
    subscription_id,
    promo_code_id
  )
  VALUES (sub_id, promo_id);

  -- Update promo code usage
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = promo_id;

  RETURN jsonb_build_object(
    'success', true,
    'promo_details', discount_info,
    'message', 'Promo code applied successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription details with all features
CREATE OR REPLACE FUNCTION get_subscription_details(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'subscription', row_to_json(s.*),
    'features', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'feature_key', f.feature_key,
          'name', f.name,
          'category', f.category,
          'is_free', f.is_free,
          'price', f.base_price,
          'billing_unit', f.billing_unit,
          'enabled', sf.enabled
        )
      ) FILTER (WHERE f.id IS NOT NULL),
      '[]'::jsonb
    ),
    'user_tier', row_to_json(ut.*),
    'total_cost', calculate_subscription_total(s.id)
  ) INTO result
  FROM subscriptions s
  LEFT JOIN subscription_features sf ON sf.subscription_id = s.id
  LEFT JOIN features f ON f.id = sf.feature_id
  LEFT JOIN LATERAL (
    SELECT * FROM user_tier_pricing
    WHERE s.user_count >= min_users 
      AND (max_users IS NULL OR s.user_count <= max_users)
    LIMIT 1
  ) ut ON true
  WHERE s.organization_id = org_id
  GROUP BY s.id, ut.*;

  IF result IS NULL THEN
    -- Create default trial subscription if none exists
    INSERT INTO subscriptions (
      organization_id,
      status,
      billing_period,
      user_count,
      user_tier_price
    )
    VALUES (
      org_id,
      'trial',
      'monthly',
      1,
      0
    );

    -- Add free features
    INSERT INTO subscription_features (subscription_id, feature_id, enabled)
    SELECT 
      (SELECT id FROM subscriptions WHERE organization_id = org_id),
      id,
      true
    FROM features
    WHERE is_free = true;

    -- Recursively call to get the new subscription
    RETURN get_subscription_details(org_id);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION activate_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION apply_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_details TO authenticated;

COMMENT ON FUNCTION update_subscription IS 'Update organization subscription with selected features';
COMMENT ON FUNCTION activate_subscription IS 'Activate subscription after trial period';
COMMENT ON FUNCTION cancel_subscription IS 'Cancel an active subscription';
COMMENT ON FUNCTION apply_promo_code IS 'Apply a promotional code to subscription';
COMMENT ON FUNCTION get_subscription_details IS 'Get complete subscription details for an organization';